// @file: /scripts/modules/map/chestManager.js
// @version: 1.2 – use resolved lootPool objects

import { createMarker } from "./markerManager.js";

/**
 * Builds a Leaflet marker for a chest instance,
 * but routes it through your shared createMarker pipeline.
 *
 * @param {Object} data    — { id, chestTypeId, coords }
 * @param {Object} typeDef — { id, name, iconUrl, lootPool: Array<{imageSmall,name}>, maxDisplay }
 * @param {L.Map} map
 * @param {Object} layers  — must include layers.Chest
 * @param {Function} ctxMenu — showContextMenu
 * @param {boolean} isAdmin
 */
export function createChestMarker(data, typeDef, map, layers, ctxMenu, isAdmin) {
  // shape into the common marker data shape
  const chestData = {
    id:         data.id,
    type:       "Chest",
    coords:     data.coords,
    name:       typeDef.name,
    imageSmall: typeDef.iconUrl
  };

  const markerObj = createMarker(
    chestData,
    map,
    layers,
    ctxMenu,
    {
      onEdit:    null,
      onCopy:    null,
      onDragEnd: null,
      onDelete:  null
    },
    isAdmin
  );

  // override its popup
  markerObj.setPopupContent(buildChestPopupHTML(typeDef));
  return markerObj;
}

/**
 * Build the specific HTML for a chest’s popup.
 * Assumes typeDef.lootPool is already an array of full item-defs.
 */
export function buildChestPopupHTML(typeDef) {
  const count = typeDef.maxDisplay || 4;
  let html = `
    <div class="chest-popup">
      <img src="${typeDef.iconUrl}" class="chest-icon">
      <strong>${typeDef.name}</strong><hr>
      <div class="chest-grid"
           style="display:grid; gap:4px;
                  grid-template-columns:repeat(${count},1fr)">
  `;

  (typeDef.lootPool || []).slice(0, count).forEach(item => {
    html += `
      <div class="chest-slot" title="${item.name || ""}">
        <img src="${item.imageSmall || ""}" style="width:100%">
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}
