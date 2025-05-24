// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.1 — apply custom-popup wrapper & chest CSS styling

import { defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Renders an HTML string for NPC markers on the map,
 * using the same structure and classes as chest popups
 * so the existing CSS applies.
 *
 * @param {Object} def NPC definition data
 * @returns {string} HTML content for Leaflet popup
 */
export function renderNpcPopup(def) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Header image
  const imgUrl = def.imageSmall || def.imageLarge || "";
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image" onerror="this.style.display='none'">`
    : "";

  // Title and metadata
  const titleColor   = def.nameColor || defaultNameColor;
  const nameHTML     = `<div class="popup-name" style="color:${titleColor}">${def.name || ""}</div>`;
  const factionHTML  = `<div class="popup-type">${def.faction}</div>`;
  const tierHTML     = `<div class="popup-rarity">${def.tier}</div>`;

  // Loot grid (reuse chest grid styling)
  const cells = (def.lootPool || []).map((item, idx) => {
    const thumb = item.imageSmall
      ? `<img src="${item.imageSmall}" class="chest-slot-img" onerror="this.style.display='none'">`
      : "";
    return `<div class="chest-slot" data-index="${idx}">${thumb}</div>`;
  }).join("");
  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:5;">
        ${cells}
      </div>
    </div>`;

  // Description & extra info
  const descHTML = def.description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">
         ${def.description}
       </p>`
    : "";
  const extraHTML = (def.extraLines || []).map(l =>
    `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
       ${l.text}
     </p>`
  ).join("");
  const divider = descHTML && extraHTML ? '<hr class="popup-divider">' : "";
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">${descHTML}${divider}${extraHTML}</div>`
    : "";

  // Assemble full popup
  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}${factionHTML}${tierHTML}
          </div>
        </div>
      </div>
      ${lootBox}
      ${textBox}
    </div>
  `;
}
 