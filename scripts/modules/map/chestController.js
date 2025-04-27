// @file: /scripts/modules/map/chestController.js
// @version: 1.1

import { subscribeChestTypes } from "../services/chestTypesService.js";
import { subscribeChests }     from "../services/chestsService.js";
import { createChestMarker }   from "./chestManager.js";

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

  // 1) Watch chest-type definitions
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    // update any existing marker popups
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestTypeMap[data.chestTypeId];
      if (def) marker.setPopupContent(buildPopupHTML(def));
    });
  });

  // 2) Watch chest instances
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
      if (!chestTypeMap[data.chestTypeId] || chestMarkers[data.id]) return;
      const marker = createChestMarker(
        data,
        chestTypeMap[data.chestTypeId],
        map,
        layers,
        showContextMenu,
        document.body.classList.contains("is-admin")
      );
      // store raw data for later popup refresh
      marker.__chestData = data;
      chestMarkers[data.id] = marker;
    });
  });
}

/**
 * Helper to build the popup HTML for a given chest type.
 * Extracted so both the controller and the marker helper can use it.
 */
function buildPopupHTML(def) {
  let html = `
    <div class="chest-popup">
      <img src="${def.iconUrl}" class="chest-icon">
      <strong>${def.name}</strong><hr>
      <div class="chest-grid"
           style="display:grid; gap:4px;
                  grid-template-columns:repeat(${def.maxDisplay},1fr)">
  `;

  def.lootPool.forEach(itemId => {
    // assumes preload of item definitions into window.itemDefMap
    const item = window.itemDefMap?.[itemId] || {};
    html += `
      <div class="chest-slot" title="${item.name || ""}">
        <img src="${item.imageSmall || ""}" style="width:100%">
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}
