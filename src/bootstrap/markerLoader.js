// @file: src/bootstrap/markerLoader.js
// @version: 1.20 — re‐attach hover listeners to .chest-slot to show item popups

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes } from "../modules/marker/types.js";
import { createMarker, renderItemPopup } from "../modules/map/markerManager.js";
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
 * Given a marker’s merged data (which includes its definition fields),
 * if it’s a Chest, convert lootPool (array of ID strings) into actual item objects.
 *
 * @param {Object} data  — merged marker+definition data 
 */
function normalizeChestLootPool(data) {
  if (!Array.isArray(data.lootPool)) return;
  const itemDefMap = definitionsManager.getDefinitions("Item") || {};
  data.lootPool = data.lootPool
    .map(id => itemDefMap[id])
    .filter(itemObj => !!itemObj);
}

/**
 * Attaches hover‐to‐show listeners to each .chest-slot within the given popup element,
 * opening a Leaflet popup showing that item’s details when hovered.
 *
 * @param {L.Marker} markerObj
 * @param {HTMLElement} popupEl  — the <div> containing the chest popup HTML
 */
function attachSlotHoverListeners(markerObj, popupEl) {
  let hoverPopup = null;

  const onSlotMouseEnter = event => {
    const slotEl = event.currentTarget;
    const itemId = slotEl.getAttribute("data-item-id");
    if (!itemId) return;
    // Lookup the full item object
    const itemDef = definitionsManager.getDefinitions("Item")[itemId];
    if (!itemDef) return;

    // Create a Leaflet popup at the cursor’s latlng
    const map = markerObj._map;
    const latlng = map.mouseEventToLatLng(event);
    hoverPopup = L.popup({
      offset: [10, 10],
      closeButton: false,
      autoClose: false,
      closeOnClick: false
    })
      .setLatLng(latlng)
      .setContent(renderItemPopup(itemDef))
      .openOn(map);
  };

  const onSlotMouseMove = event => {
    if (!hoverPopup) return;
    const map = markerObj._map;
    const latlng = map.mouseEventToLatLng(event);
    hoverPopup.setLatLng(latlng);
  };

  const onSlotMouseLeave = () => {
    if (hoverPopup) {
      hoverPopup.remove();
      hoverPopup = null;
    }
  };

  popupEl
    .querySelectorAll(".chest-slot[data-item-id]")
    .forEach(slotEl => {
      slotEl.addEventListener("mouseenter", onSlotMouseEnter);
      slotEl.addEventListener("mousemove", onSlotMouseMove);
      slotEl.addEventListener("mouseleave", onSlotMouseLeave);
    });
}

/**
 * Regenerates a marker’s popup HTML on demand. Used in our “popupopen” listener.
 *
 * @param {L.Marker} markerObj
 * @param {Object}   originalData – the Firestore record plus merged fields
 * @param {Object}   cfg          – markerTypes[data.type], contains .popupRenderer and .defIdKey
 */
function refreshPopupOnOpen(markerObj, originalData, cfg) {
  const defMap = definitionsManager.getDefinitions(originalData.type);
  const defKey = cfg.defIdKey;
  if (defKey && defMap[originalData[defKey]]) {
    // Merge fresh definition fields back into a shallow copy of originalData
    const { id: _ignore, ...freshFields } = defMap[originalData[defKey]];
    const merged = { ...originalData, ...freshFields };

    // If it’s a Chest, normalize lootPool now
    if (merged.type === "Chest") {
      normalizeChestLootPool(merged);
    }

    // Overwrite this marker’s popup with newly‐rendered HTML
    markerObj.setPopupContent(cfg.popupRenderer(merged));

    // After Leaflet inserts the new popup into the DOM, attach hover listeners
    // We use a small timeout so that the popup element exists in the DOM
    setTimeout(() => {
      const popupContainer = markerObj.getPopup().getElement();
      if (popupContainer) {
        attachSlotHoverListeners(markerObj, popupContainer);
      }
    }, 0);
  }
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
    // a) Clear out any existing markers
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

      // c) Merge definition fields
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);

        // If it’s a Chest, immediately normalize the lootPool array
        if (data.type === "Chest") {
          normalizeChestLootPool(data);
        }
      }

      // d) Prepare context‐menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, e) =>
          markerForm.openEdit(markerObj, originalData, e, payload => {
            const updated = { ...originalData, ...payload };

            // Convert the chest’s lootPool (array of objects) back to [ID,…] before saving
            if (updated.type === "Chest" && Array.isArray(payload.lootPool)) {
              updated.lootPool = payload.lootPool.map(itemObj => itemObj.id);
            }

            // Update this marker’s icon and popup immediately
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));

            // Persist to Firestore
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

      // e) Create the Leaflet marker
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      // f) Bind initial popup HTML and attach hover listeners on open
      markerObj.bindPopup(cfg.popupRenderer(data));
      markerObj.on("popupopen", () => refreshPopupOnOpen(markerObj, data, cfg));

      // g) Add to the appropriate layer
      const layerToUse = groupingEnabled ? clusterItemLayer : flatItemLayer;
      layerToUse.addLayer(markerObj);
      allMarkers.push({ markerObj, data });
    });

    // h) Reapply any active filters
    filterMarkers();
  });

  // 2) When ANY definition updates, re-render affected markers
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;

        // a) Merge fresh definition fields
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);

          // If it’s a Chest, normalize its lootPool now
          if (data.type === "Chest") {
            normalizeChestLootPool(data);
          }
        }

        // b) Update this marker’s icon & popup content immediately
        markerObj.setIcon(cfg.iconFactory(data));
        markerObj.setPopupContent(cfg.popupRenderer(data));
      });

      // c) Reapply marker filters
      filterMarkers();
    });
  });

  // 3) Load initial definitions (Item, Chest, NPC) into memory,
  //    then build item filters and render markers
  for (const [type, cfg] of Object.entries(markerTypes)) {
    const defs = await cfg.loadDefinitions(db);
    definitionsManager.getDefinitions(type); // populates definitionsMap
  }

  await loadItemFilters();
  filterMarkers();
}

export default {
  init,
  allMarkers
};
