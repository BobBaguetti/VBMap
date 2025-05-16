// @file: src/bootstrap/markerLoader.js
// @version: 1.3 — refactored to use markerTypes registry for dynamic marker creation & hydration

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes } from "../modules/marker/types.js";
import { createMarker } from "../modules/map/markerManager.js";

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
 * @param {object} [callbacks={}]
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
  // 1) Subscribe to marker data changes
  subscribeMarkers(db, markers => {
    // Clear existing markers
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add new markers
    markers.forEach(data => {
      const typeCfg = markerTypes[data.type];
      if (!typeCfg) return; // unknown type

      // Enrich with definition fields
      const defs = definitionsManager.getDefinitions(data.type);
      const defIdKey = data.predefinedItemId ? 'predefinedItemId'
                      : data.chestTypeId   ? 'chestTypeId'
                      : null;
      if (defIdKey && defs[data[defIdKey]]) {
        Object.assign(data, defs[data[defIdKey]]);
      }

      // Create marker
      const markerObj = createMarker(data, map, { clusterItemLayer, flatItemLayer }, callbacks);
      // Set popup
      if (typeCfg.popupRenderer) {
        markerObj.setPopupContent(typeCfg.popupRenderer(data));
      }
      // Add to correct layer
      const targetLayer = clusterItemLayer.hasLayer(markerObj) ? clusterItemLayer : flatItemLayer;
      targetLayer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    // Re-apply filters (no rebuild of filter list)
    filterMarkers();
  });

  // 2) Hydrate markers on definition updates for each type
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      // Update definitions cache in definitionsManager
      definitionsManager.getDefinitions(type); // internal map is already updated
      // Hydrate each existing marker of this type
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        // Re-attach definition fields
        const defMap = definitionsManager.getDefinitions(type);
        const defIdKey = data.predefinedItemId ? 'predefinedItemId'
                        : data.chestTypeId   ? 'chestTypeId'
                        : null;
        if (defIdKey && defMap[data[defIdKey]]) {
          Object.assign(data, defMap[data[defIdKey]]);
        }
        // Update icon if factory provided
        if (cfg.iconFactory) {
          markerObj.setIcon(cfg.iconFactory(data));
        }
        // Update popup
        if (cfg.popupRenderer) {
          markerObj.setPopupContent(cfg.popupRenderer(data));
        }
      });
      // Re-apply filters
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};
