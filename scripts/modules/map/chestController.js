// @file: /scripts/modules/map/chestController.js
// @version: 1.2

import { loadItemDefinitions }    from "../services/itemDefinitionsService.js";
import { subscribeChestTypes }    from "../services/chestTypesService.js";
import { subscribeChests }        from "../services/chestsService.js";
import { createChestMarker }      from "./chestManager.js";

/**
 * Initialize the real-time chest layer on the map.
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {Object} layers  — your layers object (must include layers.Chest)
 * @param {Function} showContextMenu
 */
export async function initChestLayer(db, map, layers, showContextMenu) {
  // 1) Preload all item definitions so we can resolve lootPool IDs → full objects
  const items      = await loadItemDefinitions(db);
  const itemMap    = Object.fromEntries(items.map(d => [d.id, d]));

  let chestTypeMap = {};
  const chestMarkers = {};

  // 2) Subscribe to chest‐type definitions
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));

    // refresh any existing marker popups
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const raw  = chestTypeMap[data.chestTypeId];
      if (!raw) return;

      const resolved = {
        ...raw,
        lootPool: (raw.lootPool || [])
          .map(id => itemMap[id])
          .filter(Boolean)
      };
      marker.setPopupContent(createChestMarker.buildChestPopupHTML(resolved));
    });
  });

  // 3) Subscribe to chest instances
  subscribeChests(db, chests => {
    const liveIds = new Set(chests.map(c => c.id));

    // remove deleted
    Object.keys(chestMarkers).forEach(id => {
      if (!liveIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // add new
    chests.forEach(data => {
      if (chestMarkers[data.id]) return;
      const raw = chestTypeMap[data.chestTypeId];
      if (!raw) return;

      const resolved = {
        ...raw,
        lootPool: (raw.lootPool || [])
          .map(id => itemMap[id])
          .filter(Boolean)
      };

      const marker = createChestMarker(
        data,
        resolved,
        map,
        layers,
        showContextMenu,
        document.body.classList.contains("is-admin")
      );
      marker.__chestData = data;
      chestMarkers[data.id] = marker;
    });
  });
}
