// @file: /scripts/modules/map/chestManager.js
// @version: 1.6 – mimic item-popup structure: popup-info-box, divider, extra lines

import { createMarker } from "./markerManager.js";

/**
 * Build the specific HTML for a chest’s marker popup.
 * Matches the item popup structure and styling.
 */
export function buildChestPopupHTML(typeDef) {
  // Close button
  const closeBtn = `
    <span class="popup-close-btn">
      ${createMarker.createIconHTML("x")}
    </span>`;

  // Header image
  const bigImg = typeDef.iconUrl
    ? `<img src="${typeDef.iconUrl}" class="popup-image" onerror="this.style.display='none'">`
    : "";

  // Name + subtext
  const nameHTML = `
    <div class="popup-name">${typeDef.name}</div>`;
  const subtextHTML = typeDef.subtext
    ? `<div class="popup-type">${typeDef.subtext}</div>` 
    : "";

  // Grid of loot slots
  const gridHTML = `
    <div class="chest-grid" style="--cols:4;">
      ${(typeDef.lootPool||[]).map(item=>`
        <div class="chest-slot" title="${item.name||''}">
          <img src="${item.imageSmall||''}" class="chest-slot-img">
          ${item.quantity>1
            ? `<span class="chest-slot-qty">${item.quantity}</span>`
            : ''}
        </div>`).join('')}
    </div>`;

  // Description and extra info
  const descHTML = typeDef.description
    ? `<p class="popup-desc">${typeDef.description}</p>` 
    : "";
  const extraHTML = (typeDef.extraLines||[])
    .map(line=>`<p class="popup-extra-line">${line.text}</p>`)
    .join("");

  return `
    <div class="custom-popup chest-popup" style="position:relative;">
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
