// @file: src/bootstrap/markerLoader.js
// @version: 1.18 — explicitly convert lootPool ID arrays to item objects

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes } from "../modules/marker/types.js";
import { createMarker } from "../modules/map/markerManager.js";
import { showContextMenu, hideContextMenu }
  from "../modules/context-menu/index.js";

/** 
 * Keeps track of whether “marker grouping” (clustering) is currently enabled.
 * Defaults to false (i.e. flat markers on load).
 */
let groupingEnabled = false;

/**
 * Toggle marker grouping on/off. When true, new markers are added
 * into the clusterItemLayer; when false, they go into flatItemLayer.
 *
 * @param {boolean} enabled
 */
export function setGrouping(enabled) {
  groupingEnabled = enabled;
}

/** @type {{ markerObj: L.Marker, data: object }[]} */
export const allMarkers = [];

/**
 * Takes a marker's data object (which already includes fields from its chest definition),
 * and ensures that if `data.lootPool` is an array of IDs, it is replaced with an array
 * of the corresponding item-definition objects (in the same order), filtering out any missing IDs.
 *
 * @param {Object} data  — merged marker+definition data
 */
function normalizeChestLootPool(data) {
  if (!Array.isArray(data.lootPool)) return;
  // Grab the in-memory map of all item definitions
  const itemDefMap = definitionsManager.getDefinitions("Item") || {};
  // Convert each ID to its object, filtering out any missing
  const objectPool = data.lootPool
    .map(id => itemDefMap[id])
    .filter(itemObj => !!itemObj);
  data.lootPool = objectPool;
}

/**
 * Initialize marker subscriptions, creation, and hydration.
 *
 * @param {object}   db              – Firestore instance
 * @param {L.Map}    map             – Leaflet map object
 * @param {L.LayerGroup} clusterItemLayer – MarkerClusterGroup for items & chests
 * @param {L.LayerGroup} flatItemLayer    – Regular LayerGroup for items/NPCs
 * @param {Function} filterMarkers   – Function to re-apply active filters
 * @param {Function} loadItemFilters – Function to populate sidebar filters
 * @param {boolean}  isAdmin         – Whether the user is in admin mode
 * @param {object}   callbacks       – { markerForm, copyMgr }, etc.
 */
export async function init(
  db,
  map,
  clusterItemLayer,
  flatItemLayer,
  filterMarkers,
  loadItemFilters,
  isAdmin,
  callbacks = {}
) {
  const { markerForm, copyMgr } = callbacks;

  // 1) Marker data subscription
  subscribeMarkers(db, markers => {
    // a) Clear existing markers from both layers
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // b) Rebuild markers from Firestore docs
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // c) Merge definition fields into data
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);

        // If this is a Chest, normalize its lootPool right now
        if (data.type === "Chest") {
          normalizeChestLootPool(data);
        }
      }

      // d) Prepare context‐menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, e) =>
          markerForm.openEdit(markerObj, originalData, e, payload => {
            const updated = { ...originalData, ...payload };

            // Before saving, ensure that updated.lootPool is an array of IDs
            if (updated.type === "Chest" && Array.isArray(payload.lootPool)) {
              updated.lootPool = payload.lootPool.map(itemObj => itemObj.id);
            }

            // Update the Leaflet icon and popup in-place
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));

            // Push to Firestore
            firebaseUpdateMarker(db, updated);
          }),

        onCopy: (_, d) => copyMgr.startCopy(d),

        onDragEnd: (_, d) => firebaseUpdateMarker(db, d),

        onDelete: (markerObj, d) => {
          firebaseDeleteMarker(db, d.id);
          hideContextMenu();
          markerObj.remove();
          const idx = allMarkers.findIndex(o => o.data.id === d.id);
          if (idx > -1) allMarkers.splice(idx, 1);
        }
      };

      // e) Create a new Leaflet marker with our custom icon/popup, etc.
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      // f) Ensure its popup is up‐to‐date (now that lootPool is normalized)
      if (cfg.popupRenderer) {
        markerObj.setPopupContent(cfg.popupRenderer(data));
      }

      // g) Add to the appropriate layer
      const layerToUse = groupingEnabled ? clusterItemLayer : flatItemLayer;
      layerToUse.addLayer(markerObj);
      allMarkers.push({ markerObj, data });
    });

    // h) Reapply any active marker‐filters
    filterMarkers();
  });

  // 2) Whenever definitions (including chests) update, re-render affected markers
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;

        // a) Merge updated definition fields back into data
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);

          // If this is a Chest, normalize its lootPool immediately
          if (data.type === "Chest") {
            normalizeChestLootPool(data);
          }
        }

        // b) Refresh icon & popup
        markerObj.setIcon(cfg.iconFactory(data));
        markerObj.setPopupContent(cfg.popupRenderer(data));
      });

      // c) Reapply marker filters so updated popups/icons respect current UI state
      filterMarkers();
    });
  });

  // 3) Load initial definitions (Item, Chest, NPC) into memory & build item filters
  for (const [type, cfg] of Object.entries(markerTypes)) {
    const defs = await cfg.loadDefinitions(db);
    definitionsManager.getDefinitions(type); // ensures definitionsMap[type] is initialized
  }

  // 4) Build item filters (once, using the initial Item definitions)
  await loadItemFilters();
  filterMarkers();
}

export default {
  init,
  allMarkers
};
