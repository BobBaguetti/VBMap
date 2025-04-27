// @file: /scripts/modules/map/chestController.js
// @version: 1.1 – subscribeChests import and cleanup

import { subscribeChestTypes } from "../services/chestTypesService.js";
import { subscribeChests }     from "../services/chestsService.js";
import {
  createChestMarker,
  buildChestPopupHTML
} from "./chestManager.js";

/**
 * Initialize real‐time chest markers on the map.
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {Object} layers  — must include a `layers.Chest` layerGroup
 * @param {Function} showContextMenu
 */
export function initChestLayer(db, map, layers, showContextMenu) {
  let chestTypeMap   = {};
  const chestMarkers = {};

  // 1) Load chest‐type definitions and cache
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    // Update existing markers’ popups
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestTypeMap[data.chestTypeId];
      if (def) {
        marker.setPopupContent(buildChestPopupHTML(def));
      }
    });
  });

  // 2) Load chest instances
  subscribeChests(db, chests => {
    const newIds = new Set(chests.map(c => c.id));

    // Remove deleted markers
    Object.keys(chestMarkers).forEach(id => {
      if (!newIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // Add or update markers
    chests.forEach(data => {
      // Skip if its type isn't loaded yet
      const def = chestTypeMap[data.chestTypeId];
      if (!def) return;

      // If marker already exists, skip
      if (chestMarkers[data.id]) return;

      // Create marker and store its data
      const marker = createChestMarker(
        data,
        def,
        map,
        layers,
        showContextMenu
      );
      // Attach raw data for later popup-refresh
      marker.__chestData = data;
      chestMarkers[data.id] = marker;
    });
  });
}
