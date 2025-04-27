// @file: /scripts/modules/map/chestManager.js
// @version: 1.1 – now reusing createMarker for unified styling & behavior

import { createMarker } from "./markerManager.js";

/**
 * Builds a Leaflet marker for a chest instance,
 * but routes it through your shared createMarker pipeline.
 *
 * @param {Object} data    — { id, chestTypeId, coords }
 * @param {Object} typeDef — { id, name, iconUrl, lootPool, maxDisplay }
 * @param {L.Map} map
 * @param {Object} layers  — your layers object (must have layers.Chest)
 * @param {Function} ctxMenu — showContextMenu
 * @param {boolean} isAdmin
 */
export function createChestMarker(data, typeDef, map, layers, ctxMenu, isAdmin) {
  // 1) Shape it like any other marker’s data
  const chestData = {
    id:         data.id,
    type:       "Chest",
    coords:     data.coords,
    name:       typeDef.name,
    imageSmall: typeDef.iconUrl,
    // you can include other fields if your renderPopup needs them
  };

  // 2) Create via your shared helper (will apply CSS classes, clustering, context menus, etc.)
  const markerObj = createMarker(
    chestData,
    map,
    layers,
    ctxMenu,
    {
      // optional callbacks:
      onEdit:   null, // we don’t edit instances via this modal
      onCopy:   null,
      onDragEnd: isAdmin
        ? (_, d) => {
            // if you want drag saving, you can hook in here
          }
        : null,
      onDelete: isAdmin
        ? (m, d) => {
            // remove from layer and let your delete-chest logic in chestController handle Firestore
            layers.Chest.removeLayer(m);
          }
        : null
    },
    isAdmin
  );

  // 3) Override popup content with chest‐specific HTML
  markerObj.setPopupContent(buildChestPopupHTML(typeDef));

  return markerObj;
}

/**
 * Build the specific HTML for a chest’s popup.
 * You can keep your existing markup here.
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
  typeDef.lootPool.forEach(itemId => {
    // assuming you have a global itemDefMap loaded in chestController
    const def = itemDefMap?.[itemId];
    html += `
      <div class="chest-slot" title="${def?.name || ""}">
        <img src="${def?.imageSmall || ""}" style="width:100%" />
      </div>
    `;
  });
  html += `</div></div>`;
  return html;
}
