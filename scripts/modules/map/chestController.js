// @file: /scripts/modules/map/chestController.js
// @version: 1.3 – now subscribing to chestDefinitions

import { subscribeChestDefinitions } from "../services/chestDefinitionsService.js";
import { subscribeChests }           from "../services/chestsService.js";
import {
  subscribeItemDefinitions,
  loadItemDefinitions
} from "../services/itemDefinitionsService.js";
import {
  createChestMarker,
  buildChestPopupHTML
} from "./chestManager.js";

export function initChestLayer(db, map, layers, showContextMenu) {
  let chestDefMap = {};
  let itemDefMap  = {};
  const chestMarkers = {};

  // live chestDefinition updates
  subscribeChestDefinitions(db, defs => {
    chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestDefMap[data.chestTypeId];
      if (!def) return;
      const full = {
        ...def,
        lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
      };
      marker.setPopupContent(buildChestPopupHTML(full));
    });
  });

  // live itemDefinition updates
  subscribeItemDefinitions(db, items => {
    itemDefMap = Object.fromEntries(items.map(i => [i.id, i]));
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestDefMap[data.chestTypeId];
      if (!def) return;
      const full = {
        ...def,
        lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
      };
      marker.setPopupContent(buildChestPopupHTML(full));
    });
  });

  // watch actual chest instances
  subscribeChests(db, chests => {
    const live = new Set(chests.map(c => c.id));
    // remove old
    Object.keys(chestMarkers).forEach(id => {
      if (!live.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });
    // add new
    chests.forEach(data => {
      if (!chestDefMap[data.chestTypeId] || chestMarkers[data.id]) return;
      const raw = chestDefMap[data.chestTypeId];
      const full = {
        ...raw,
        lootPool: (raw.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
      };
      const m = createChestMarker(
        data,
        full,
        map,
        layers,
        showContextMenu,
        document.body.classList.contains("is-admin")
      );
      m.__chestData = data;
      chestMarkers[data.id] = m;
    });
  });
}
