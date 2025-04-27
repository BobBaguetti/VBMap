// @file: /scripts/modules/map/chestController.js
// @version: 1.2 – resolve lootPool IDs into full defs

import {
  subscribeChestTypes
} from "../services/chestTypesService.js";
import {
  subscribeChests
} from "../services/chestsService.js";
import {
  subscribeItemDefinitions,
  loadItemDefinitions
} from "../services/itemDefinitionsService.js";
import {
  createChestMarker,
  buildChestPopupHTML
} from "./chestManager.js";

export function initChestLayer(db, map, layers, showContextMenu) {
  let chestTypeMap   = {};
  let itemDefMap     = {};
  const chestMarkers = {};

  // Keep a live map of item definitions
  subscribeItemDefinitions(db, items => {
    itemDefMap = Object.fromEntries(items.map(i => [i.id, i]));
    // Refresh popups on every change
    Object.values(chestMarkers).forEach(marker => {
      const data   = marker.__chestData;
      const rawDef = chestTypeMap[data.chestTypeId];
      if (!rawDef) return;
      const def = {
        ...rawDef,
        lootPool: (rawDef.lootPool || [])
                    .map(id => itemDefMap[id])
                    .filter(Boolean)
      };
      marker.setPopupContent(buildChestPopupHTML(def));
    });
  });

  // Watch chest-type definitions
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    // Update any existing marker popups
    Object.values(chestMarkers).forEach(marker => {
      const data   = marker.__chestData;
      const rawDef = chestTypeMap[data.chestTypeId];
      if (!rawDef) return;
      const def = {
        ...rawDef,
        lootPool: (rawDef.lootPool || [])
                    .map(id => itemDefMap[id])
                    .filter(Boolean)
      };
      marker.setPopupContent(buildChestPopupHTML(def));
    });
  });

  // Watch chest instances
  subscribeChests(db, chests => {
    const liveIds = new Set(chests.map(c => c.id));

    // Remove deleted
    Object.keys(chestMarkers).forEach(id => {
      if (!liveIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // Add new
    chests.forEach(data => {
      if (!chestTypeMap[data.chestTypeId] || chestMarkers[data.id]) return;

      const rawDef = chestTypeMap[data.chestTypeId];
      const def = {
        ...rawDef,
        lootPool: (rawDef.lootPool || [])
                    .map(id => itemDefMap[id])
                    .filter(Boolean)
      };

      const marker = createChestMarker(
        data,
        def,
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
