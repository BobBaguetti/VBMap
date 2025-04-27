// path: scripts/modules/map/chestManager.js
// version: 1.2

/**
 * Map manager for rendering chest markers on the map.
 */
import { renderPopup as renderItemPopup } from "./markerManager.js";

/**
 * Create and add a chest marker to the specified layer group.
 * @param {Object} data          — Chest instance data ({ id, chestTypeId, coords })
 * @param {Object} typeDef       — Chest type definition ({ id, name, iconUrl, lootPool, maxDisplay })
 * @param {L.Map}  map           — Leaflet map instance
 * @param {Object} layers        — Named layer groups; must include layers.Chest
 * @param {Function} showContextMenu — Function to show context menu (for admin actions)
 * @returns {L.Marker}
 */
export function createChestMarker(data, typeDef, map, layers, showContextMenu) {
  const icon = L.icon({
    iconUrl: typeDef.iconUrl,
    iconSize: [32, 32]
  });
  const marker = L.marker(data.coords, { icon }).addTo(layers.Chest);

  marker.bindPopup(buildChestPopupHTML(typeDef), {
    className: "chest-popup-wrapper",
    maxWidth: 300
  });

  // Admin-only context menu for deletion
  marker.on("contextmenu", ev => {
    if (document.body.classList.contains("is-admin")) {
      showContextMenu(
        ev.originalEvent.pageX,
        ev.originalEvent.pageY,
        [{
          text: "Delete Chest",
          action: () => layers.Chest.removeLayer(marker)
        }]
      );
    }
  });

  return marker;
}

/**
 * Build the HTML content for a chest popup.
 * @param {Object} typeDef — Chest type definition
 * @returns {string} HTML string
 */
export function buildChestPopupHTML(typeDef) {
  let html = `
    <div class="chest-popup">
      <img src="${typeDef.iconUrl}" class="chest-icon" />
      <strong>${typeDef.name}</strong>
      <hr>
      <div class="chest-grid" style="
        display:grid;
        gap:4px;
        grid-template-columns:repeat(${typeDef.maxDisplay},1fr)">
  `;

  typeDef.lootPool.forEach(itemDef => {
    html += `
      <div class="chest-slot" title="${itemDef.name || ''}">
        <img src="${itemDef.imageSmall || ''}" style="width:100%" />
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
  return html;
}
