// @file: /scripts/modules/map/chestManager.js
// @version: 1.5 – render Subtext, fixed 4-column grid, Description & Extra Info

import { createMarker } from "./markerManager.js";

/**
 * Builds a Leaflet marker for a chest instance,
 * routed through the shared createMarker pipeline.
 *
 * @param {Object} data    — { id, chestTypeId, coords }
 * @param {Object} typeDef — { id, name, iconUrl, subtext, lootPool: Array<{name,imageSmall,quantity}>, description, extraLines }
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
      onEdit:    null,
      onCopy:    null,
      onDragEnd: isAdmin ? (_, d) => { /* optional drag logic */ } : null,
      onDelete:  isAdmin ? (m) => layers.Chest.removeLayer(m) : null
    },
    isAdmin
  );

  markerObj.setPopupContent(buildChestPopupHTML(typeDef));
  return markerObj;
}

/**
 * Build the specific HTML for a chest’s popup.
 * Always uses a 4-column grid, wrapping onto new rows as needed.
 */
export function buildChestPopupHTML(typeDef) {
  let html = `
    <div class="custom-popup" style="position:relative;">
      <span class="popup-close-btn" style="position:absolute;top:8px;right:8px;cursor:pointer;padding:4px;">
        ✖
      </span>
      <div class="popup-header">
        <div class="popup-header-left">
          <img
            src="${typeDef.iconUrl}"
            class="popup-image"
            onerror="this.style.display='none'"
          >
          <div class="popup-info">
            <div class="popup-name">${typeDef.name}</div>
            ${typeDef.subtext
              ? `<div class="popup-subtext">${typeDef.subtext}</div>`
              : ''
            }
          </div>
        </div>
      </div>
      <div class="popup-body">
        <div class="chest-grid" style="--cols: 4;">
  `;

  (typeDef.lootPool || []).forEach(item => {
    html += `
      <div class="chest-slot" title="${item.name || ''}">
        <img src="${item.imageSmall || ''}" class="chest-slot-img" />
        ${item.quantity > 1
          ? `<span class="chest-slot-qty">${item.quantity}</span>`
          : ''
        }
      </div>`;
  });

  html += `
        </div>
        ${typeDef.description
          ? `<p class="popup-desc">${typeDef.description}</p>
             <hr class="popup-divider">`
          : ''
        }
        ${(typeDef.extraLines || []).map(line => `
          <p class="popup-extra-line">${line.text}</p>
        `).join('')}
      </div>
    </div>
  `;
  return html;
}
