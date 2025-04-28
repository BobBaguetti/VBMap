// @file: /scripts/modules/map/chestManager.js
// @version: 1.8 – always render 4 slots (with placeholders) so grid never collapses

import { createMarker } from "./markerManager.js";

/**
 * Builds a Leaflet marker for a chest instance,
 * routed through the shared createMarker pipeline.
 *
 * @param {Object} data    — { id, chestTypeId, coords }
 * @param {Object} typeDef — { id, name, iconUrl, subtext, lootPool, description, extraLines }
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
      onDelete:  isAdmin
        ? (m) => layers.Chest.removeLayer(m)
        : null
    },
    isAdmin
  );

  markerObj.setPopupContent(buildChestPopupHTML(typeDef));
  return markerObj;
}

/**
 * Build the specific HTML for a chest’s popup.
 * Matches the item popup structure and styling,
 * and always renders 4 grid slots (with empty placeholders).
 */
export function buildChestPopupHTML(typeDef) {
  // close-button
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // header image
  const bigImg = typeDef.iconUrl
    ? `<img src="${typeDef.iconUrl}"
            class="popup-image"
            onerror="this.style.display='none'">`
    : "";

  // name + subtext
  const nameHTML    = `<div class="popup-name">${typeDef.name}</div>`;
  const subtextHTML = typeDef.subtext
    ? `<div class="popup-type">${typeDef.subtext}</div>`
    : "";

  // always 4 columns
  const count = 4;
  let slotsMarkup = "";

  // build exactly `count` slots, filling empties if needed
  for (let i = 0; i < count; i++) {
    const item = (typeDef.lootPool || [])[i];
    if (item) {
      slotsMarkup += `
        <div class="chest-slot" title="${item.name||""}">
          <img src="${item.imageSmall||""}" class="chest-slot-img">
          ${item.quantity > 1
            ? `<span class="chest-slot-qty">${item.quantity}</span>`
            : ""}
        </div>`;
    } else {
      // placeholder slot
      slotsMarkup += `<div class="chest-slot"></div>`;
    }
  }

  const gridHTML = `
    <div class="chest-grid" style="--cols:${count};">
      ${slotsMarkup}
    </div>`;

  // description & extra‐info
  const descHTML  = typeDef.description
    ? `<p class="popup-desc">${typeDef.description}</p>`
    : "";
  const extraHTML = (typeDef.extraLines || [])
    .map(line => `<p class="popup-extra-line">${line.text}</p>`)
    .join("");

  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}
            ${subtextHTML}
          </div>
        </div>
      </div>
      <div class="popup-body popup-info-box">
        ${gridHTML}
        ${descHTML ? `<hr class="popup-divider">${descHTML}` : ""}
        ${extraHTML}
      </div>
    </div>`;
}
