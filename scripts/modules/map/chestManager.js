// @file: /scripts/modules/map/chestManager.js
// @version: 1.2 – reuse createMarker & tag icon element for CSS

import { createMarker } from "./markerManager.js";

/**
 * Create a Chest marker via the shared createMarker pipeline,
 * then tag its <img> so we can style it via CSS.
 *
 * @param {Object} data    – { id, chestTypeId, coords }
 * @param {Object} typeDef – { id, name, iconUrl, lootPool, maxDisplay }
 * @param {L.Map} map
 * @param {Object} layers  – your layers object (must include layers.Chest)
 * @param {Function} ctxMenu  – showContextMenu
 * @param {boolean} isAdmin
 */
export function createChestMarker(data, typeDef, map, layers, ctxMenu, isAdmin) {
  // 1) Prepare a “markerData” payload matching your other markers
  const markerData = {
    id:         data.id,
    type:       "Chest",
    coords:     data.coords,
    name:       typeDef.name,
    imageSmall: typeDef.iconUrl
  };

  // 2) Delegate to the shared helper
  const markerObj = createMarker(
    markerData,
    map,
    layers,
    ctxMenu,
    {
      onEdit:    null,
      onCopy:    null,
      onDragEnd: isAdmin ? (_, d) => {} : null,
      onDelete:  isAdmin
        ? (m, d) => { layers.Chest.removeLayer(m); }
        : null
    },
    isAdmin
  );

  // 3) Tag its icon element for CSS styling
  markerObj.on("add", () => {
    const el = markerObj.getElement(); 
    if (el && el.tagName === "IMG") {
      el.classList.add("chest-marker-icon");
    }
  });

  // 4) Override its popup content
  markerObj.setPopupContent(buildChestPopupHTML(typeDef));

  return markerObj;
}


/**
 * Build the HTML for a chest’s popup.
 * @param {Object} typeDef
 */
export function buildChestPopupHTML(typeDef) {
  let html = `
    <div class="chest-popup">
      <img src="${typeDef.iconUrl}" class="chest-icon">
      <strong>${typeDef.name}</strong><hr>
      <div class="chest-grid"
           style="display:grid; gap:4px;
                  grid-template-columns:repeat(${typeDef.maxDisplay},1fr)">
  `;
  (typeDef.lootPool || []).forEach(itemId => {
    const def = itemDefMap?.[itemId] || {};
    html += `
      <div class="chest-slot" title="${def.name || ""}">
        <img src="${def.imageSmall || ""}" style="width:100%" />
      </div>
    `;
  });
  html += `</div></div>`;
  return html;
}
