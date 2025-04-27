// @file: /scripts/modules/map/chestManager.js
// @version: 1.2 – expect lootPool as Array<Object> rather than IDs

import { createMarker } from "./markerManager.js";

/**
 * Builds a Leaflet marker for a chest instance,
 * routed through the shared createMarker pipeline.
 *
 * @param {Object} data    — { id, chestTypeId, coords }
 * @param {Object} typeDef — { id, name, iconUrl, lootPool: Array<{name,imageSmall}>, maxDisplay }
 * @param {L.Map} map
 * @param {Object} layers  — must include layers.Chest
 * @param {Function} ctxMenu — showContextMenu
 * @param {boolean} isAdmin
 */
export function createChestMarker(data, typeDef, map, layers, ctxMenu, isAdmin) {
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
      onEdit:   null,
      onCopy:   null,
      onDragEnd: isAdmin ? (_, d) => { /* optional drag logic */ } : null,
      onDelete: isAdmin
        ? (m, d) => layers.Chest.removeLayer(m)
        : null
    },
    isAdmin
  );

  markerObj.setPopupContent(buildChestPopupHTML(typeDef));
  return markerObj;
}

/**
 * Build the specific HTML for a chest’s popup.
 * Expects typeDef.lootPool to be full item-definition objects.
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

  (typeDef.lootPool || [])
    .slice(0, count)
    .forEach(itemDef => {
      html += `
        <div class="chest-slot" title="${itemDef.name || ""}">
          <img src="${itemDef.imageSmall || ""}" style="width:100%">
        </div>
      `;
    });

  html += `</div></div>`;
  return html;
}
