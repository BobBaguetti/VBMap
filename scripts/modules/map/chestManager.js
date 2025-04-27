// @file: /scripts/modules/map/chestManager.js
// @version: 1.0 – initial implementation

import { renderPopup as renderItemPopup } from "./markerManager.js";

/**
 * Create and render a chest marker on the map.
 * @param {Object} data     — { id, chestTypeId, coords: [lat, lng] }
 * @param {Object} typeDef  — { iconUrl, name, lootPool, maxDisplay }
 * @param {L.Map} map
 * @param {Object} layers   — must include layers.Chest (L.layerGroup)
 * @param {Function} showContextMenu
 * @returns {L.Marker}
 */
export function createChestMarker(data, typeDef, map, layers, showContextMenu) {
  const icon = L.icon({ iconUrl: typeDef.iconUrl, iconSize: [32, 32] });
  const marker = L.marker(data.coords, { icon }).addTo(layers.Chest);

  marker.bindPopup(buildChestPopupHTML(typeDef), {
    className: "chest-popup-wrapper",
    maxWidth: 300
  });

  // Right‐click context menu (admin only)
  marker.on("contextmenu", ev => {
    if (document.body.classList.contains("is-admin")) {
      showContextMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, [
        {
          text: "Delete Chest",
          action: () => {
            // let the instance subscription handle removal
            marker.remove();
          }
        }
      ]);
    }
  });

  return marker;
}

/**
 * Build the HTML content for a chest‐popup.
 * Shows chest icon, title, and a grid of item thumbnails.
 * @param {Object} typeDef  — { iconUrl, name, lootPool, maxDisplay }
 * @returns {string} HTML string
 */
export function buildChestPopupHTML(typeDef) {
  let html = `
    <div class="chest-popup">
      <img src="${typeDef.iconUrl}" class="chest-icon">
      <strong>${typeDef.name}</strong>
      <hr>
      <div class="chest-grid" style="
           display: grid;
           gap: 4px;
           grid-template-columns: repeat(${typeDef.maxDisplay},1fr);
         ">
  `;

  typeDef.lootPool.forEach(itemDef => {
    html += `
      <div class="chest-slot" title="${itemDef.name}">
        <img src="${itemDef.imageSmall}" style="width:100%">
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
  return html;
}
