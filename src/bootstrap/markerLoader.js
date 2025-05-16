// @file: src/bootstrap/markerLoader.js
// @version: 1.6 — purge leftover fields on type change to prevent old border colors from persisting

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes }    from "../modules/marker/types.js";
import { createMarker }    from "../modules/map/markerManager.js";
import { showContextMenu, hideContextMenu } from "../modules/ui/uiManager.js";

/** @type {{ markerObj: L.Marker, data: object }[]} */
export const allMarkers = [];

/**
 * Initialize marker subscriptions, creation, and hydration.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {L.LayerGroup} clusterItemLayer
 * @param {L.LayerGroup} flatItemLayer
 * @param {() => void} filterMarkers
 * @param {() => Promise<void>} loadItemFilters
 * @param {boolean} isAdmin
 * @param {{ markerForm: object, copyMgr: object }} callbacks
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

  // 1) Subscribe to marker data changes
  subscribeMarkers(db, markers => {
    // Clear existing markers
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add incoming markers
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Merge definition fields without overwriting data.id
      const defs  = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defs[data[defKey]]) {
        const { id: _ignore, ...fields } = defs[data[defKey]];
        Object.assign(data, fields);
      }

      // Context-menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, event) =>
          markerForm.openEdit(markerObj, originalData, event, payload => {
            // Purge any leftover fields when switching types
            if (payload.type !== originalData.type) {
              if (payload.type === "Chest") {
                delete originalData.rarity;
                delete originalData.itemType;
                delete originalData.value;
                delete originalData.quantity;
              } else if (payload.type === "Item") {
                delete originalData.category;
                delete originalData.size;
                delete originalData.chestTypeId;
                delete originalData.lootPool;
              }
            }
            // Merge the payload onto the original data (preserving data.id)
            const updated = { ...originalData, ...payload };
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));
            firebaseUpdateMarker(db, updated);
          }),
        onCopy:    (_, d) => copyMgr.startCopy(d),
        onDragEnd: (_, d) => firebaseUpdateMarker(db, d),
        onDelete:  (markerObj, d) => {
          firebaseDeleteMarker(db, d.id);
          hideContextMenu();
          markerObj.remove();
          const idx = allMarkers.findIndex(o => o.data.id === d.id);
          if (idx > -1) allMarkers.splice(idx, 1);
        }
      };

      // Create marker with context-menu support
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      // Set popup content
      if (cfg.popupRenderer) {
        markerObj.setPopupContent(cfg.popupRenderer(data));
      }

      // Add to the correct layer
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    // Re-apply filters
    filterMarkers();
  });

  // 2) Hydrate on definition updates for each marker type
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      // definitionsManager already updated internally
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);
        }
        if (cfg.iconFactory)    markerObj.setIcon(cfg.iconFactory(data));
        if (cfg.popupRenderer)  markerObj.setPopupContent(cfg.popupRenderer(data));
      });
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};
