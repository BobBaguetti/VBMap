// @file: /scripts/modules/map/chestController.js
// @version: 1.2 – enrich lootPool & unify popup builder

import { loadItemDefinitions }      from "../services/itemDefinitionsService.js";
import { subscribeChestTypes }      from "../services/chestTypesService.js";
import { subscribeChests }          from "../services/chestsService.js";
import { createChestMarker,
         buildChestPopupHTML }      from "./chestManager.js";

/**
 * Initialize the real-time chest layer on the map.
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {Object} layers  — your layers object (must include layers.Chest)
 * @param {Function} showContextMenu
 */
export function initChestLayer(db, map, layers, showContextMenu) {
  let chestTypeMap   = {};
  const chestMarkers = {};
  let itemDefMap     = {};

  // Load all item definitions once so we can look up names & images.
  async function ensureItemDefs() {
    if (Object.keys(itemDefMap).length) return;
    const items = await loadItemDefinitions(db);
    itemDefMap = Object.fromEntries(items.map(d => [d.id, d]));
  }

  // Whenever chest-type defs change, update popups on existing markers.
  subscribeChestTypes(db, async types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    await ensureItemDefs();

    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestTypeMap[data.chestTypeId];
      if (!def) return;

      // build an enriched version:
      const enriched = {
        ...def,
        lootPool: (def.lootPool || [])
          .map(id => itemDefMap[id])
          .filter(Boolean)
      };

      marker.setPopupContent(buildChestPopupHTML(enriched));
    });
  });

  // Watch for chest-instances (add / remove markers)
  subscribeChests(db, async chests => {
    await ensureItemDefs();

    const liveIds = new Set(chests.map(c => c.id));

    // 1) Remove deleted
    Object.keys(chestMarkers).forEach(id => {
      if (!liveIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // 2) Add new
    chests.forEach(data => {
      if (!chestTypeMap[data.chestTypeId] || chestMarkers[data.id]) return;

      const def = chestTypeMap[data.chestTypeId];
      const enriched = {
        ...def,
        lootPool: (def.lootPool || [])
          .map(id => itemDefMap[id])
          .filter(Boolean)
      };

      const marker = createChestMarker(
        data,
        enriched,
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
