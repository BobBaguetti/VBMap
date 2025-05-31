// @file: src/bootstrap/markerLoader.js
// @version: 1.16 — added grouping toggle logic

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
import { enrichLootPool } from "./lootUtils.js";  // new helper

/** 
 * Keeps track of whether “marker grouping” (clustering) is currently enabled.
 * Defaults to false (i.e. flat markers).
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
 * Initialize marker subscriptions, creation, and hydration.
 *
 * @param {object}   db              – Firestore instance
 * @param {L.Map}    map             – Leaflet map object
 * @param {L.LayerGroup} clusterItemLayer – MarkerClusterGroup for items
 * @param {L.LayerGroup} flatItemLayer    – Regular LayerGroup for items
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
    // Clear out every existing marker from both layers and remove from map
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Rebuild all markers from Firestore docs
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Merge definition fields (e.g., item/chest/NPC data)
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);
        // Enrich loot pool for Chest and NPC
        enrichLootPool(data, "Item");
      }

      // Context‐menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, e) =>
          markerForm.openEdit(markerObj, originalData, e, payload => {
            const updated = { ...originalData, ...payload };
            // Update icon & popup in place:
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));
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

      // Create a new Leaflet marker with our custom icon/popup/etc.
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      // Ensure its popup is up‐to‐date
      if (cfg.popupRenderer) {
        markerObj.setPopupContent(cfg.popupRenderer(data));
      }

      // 2) Add to the correct layer based on the groupingEnabled flag
      const layer = groupingEnabled ? clusterItemLayer : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    // Re‐apply any active filters (so that hidden markers stay hidden)
    filterMarkers();
  });

  // 3) Whenever definitions update (e.g. a chest loot table changes),
  //    re‐render icons & popups for all markers of that type
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);
          enrichLootPool(data, "Item");
        }
        markerObj.setIcon(cfg.iconFactory(data));
        markerObj.setPopupContent(cfg.popupRenderer(data));
      });
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};
