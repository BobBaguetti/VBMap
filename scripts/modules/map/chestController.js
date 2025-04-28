// @file: /scripts/modules/map/chestController.js
// @version: 1.4 – unified into the markers collection 

import { subscribeMarkers } from "../services/firebaseService.js";
import {
  subscribeChestDefinitions
} from "../services/chestDefinitionsService.js";
import {
  subscribeItemDefinitions
} from "../services/itemDefinitionsService.js";
import {
  createChestMarker,
  buildChestPopupHTML
} from "./chestManager.js";

export function initChestLayer(db, map, layers, showContextMenu) {
  let chestDefMap = {};
  let itemDefMap  = {};
  const chestMarkers = {};

  // keep chest definitions live
  subscribeChestDefinitions(db, defs => {
    chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    _refreshAllPopups();
  });

  // keep item definitions live
  subscribeItemDefinitions(db, items => {
    itemDefMap = Object.fromEntries(items.map(i => [i.id, i]));
    _refreshAllPopups();
  });

  // subscribe to all markers, but handle only chests
  subscribeMarkers(db, allMarkers => {
    const newChestIds = new Set(
      allMarkers.filter(m => m.type === "Chest").map(m => m.id)
    );

    // remove markers that no longer exist
    Object.keys(chestMarkers).forEach(id => {
      if (!newChestIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // add or update chest markers
    allMarkers.forEach(data => {
      if (data.type !== "Chest") return;
      // already drawn?
      if (chestMarkers[data.id]) return;

      const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
      const fullDef = {
        ...def,
        lootPool: (def.lootPool || [])
          .map(id => itemDefMap[id])
          .filter(Boolean)
      };

      const marker = createChestMarker(
        data,
        fullDef,
        map,
        layers,
        showContextMenu,
        document.body.classList.contains("is-admin")
      );
      marker.__chestData = data;
      chestMarkers[data.id] = marker;
    });
  });

  // helper to re-render popups when definitions change
  function _refreshAllPopups() {
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestDefMap[data.chestTypeId];
      if (!def) return;
      const fullDef = {
        ...def,
        lootPool: (def.lootPool || [])
          .map(id => itemDefMap[id])
          .filter(Boolean)
      };
      marker.setPopupContent(buildChestPopupHTML(fullDef));
    });
  }
}
