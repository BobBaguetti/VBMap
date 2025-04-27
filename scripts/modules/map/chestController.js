// @file: /scripts/modules/map/chestController.js
// @version: 1.0

/**
 * Controller to initialize real-time chest markers on the map.
 */
import { subscribeChestTypes } from "../services/chestTypesService.js";
import { subscribeChests }     from "../services/chestsService.js";
import {
  createChestMarker,
  buildChestPopupHTML
} from "./chestManager.js";

/**
 * Initialize chest layer subscriptions and rendering.
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {Object} layers Leaflet layer groups, must include layers.Chest
 * @param {Function} showContextMenu
 */
export function initChestLayer(db, map, layers, showContextMenu) {
  let chestTypeMap   = {};
  const chestMarkers = {};

  // 1) Subscribe to chest-type definitions
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    // Refresh any existing markers’ popups
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestTypeMap[data.chestTypeId];
      if (def) marker.setPopupContent(buildChestPopupHTML(def));
    });
  });

  // 2) Subscribe to chest instances
  subscribeChests(db, chests => {
    const newIds = new Set(chests.map(c => c.id));

    // Remove deleted
    Object.keys(chestMarkers).forEach(id => {
      if (!newIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // Add new
    chests.forEach(data => {
      if (!chestTypeMap[data.chestTypeId]) return;
      if (chestMarkers[data.id]) return;
      const marker = createChestMarker(
        data,
        chestTypeMap[data.chestTypeId],
        map,
        layers,
        showContextMenu
      );
      marker.__chestData = data;
      chestMarkers[data.id] = marker;
    });
  });
}
