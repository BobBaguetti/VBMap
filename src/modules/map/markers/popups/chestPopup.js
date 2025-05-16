// @file: src/modules/map/marker/popups/chestPopup.js
// @version: 1.1 — refactored to use popupBase wrapper

import popupBase from "../common/popupBase.js";
import { formatRarity } from "../../../utils/utils.js";
import { rarityColors, defaultNameColor } from "../../../utils/colorPresets.js";
import { CHEST_RARITY } from "../utils.js";

/**
 * Render the popup HTML for a chest marker, wrapped in the shared popupBase.
 * @param {Object} typeDef – chest definition (category, size, lootPool, etc.)
 * @returns {string} HTML string for Leaflet bindPopup
 */
export function renderChestPopup(typeDef) {
  // 1) Compute rarity
  const category = typeDef.category || "Normal";
  const size     = typeDef.size     || "Small";
  const key      = CHEST_RARITY[category]?.[size] || "common";
  const rarityLabel = formatRarity(key);
  const rarityColor = rarityColors[key] || defaultNameColor;

  // 2) Header pieces
  const bigImg = typeDef.imageSmall || typeDef.imageLarge
    ? `<img src="${typeDef.imageSmall || typeDef.imageLarge}" class="popup-image"
             style="border-color:${rarityColor}"
             onerror="this.style.display='none'">`
    : "";

  const titleColor = typeDef.nameColor || rarityColor;
  const nameHTML = `<div class="popup-name" style="color:${titleColor};">${typeDef.name || ""}</div>`;
  const categoryHTML = `<div class="popup-type">${category}</div>`;
  const rarityHTML   = `<div class="popup-rarity" style="color:${rarityColor};">${rarityLabel}</div>`;

  // 3) Loot grid
  const COLS = 5;
  const pool = typeDef.lootPool || [];
  let cells = "";
  pool.forEach((item, idx) => {
    const color = item.rarityColor
      || rarityColors[(item.rarity || "").toLowerCase()]
      || defaultNameColor;
    cells += `
      <div class="chest-slot" data-index="${idx}" style="border-color:${color}">
        <img src="${item.imageSmall || ""}" class="chest-slot-img">
        ${item.quantity > 1 ? `<span class="chest-slot-qty">${item.quantity}</span>` : ""}
      </div>`;
  });
  // fill empty slots
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index=""></div>`;
  }
  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // 4) Description & extra lines
  const descHTML = typeDef.description
    ? `<p class="popup-desc" style="color:${typeDef.descriptionColor || defaultNameColor};">
         ${typeDef.description}
       </p>`
    : "";
  const extraHTML = (typeDef.extraLines || [])
    .map(line => `
      <p class="popup-extra-line" style="color:${line.color || defaultNameColor};">
        ${line.text}
      </p>`)
    .join("");
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">
         ${descHTML}
         ${descHTML && extraHTML ? '<hr class="popup-divider">' : ''}
         ${extraHTML}
       </div>`
    : "";

  // 5) Assemble inner content
  const inner = `
    <div class="popup-header">
      <div class="popup-header-left">
        ${bigImg}
        <div class="popup-info">
          ${nameHTML}${categoryHTML}${rarityHTML}
        </div>
      </div>
    </div>
    ${lootBox}
    ${textBox}
  `;

  // wrap and return
  return popupBase(inner);
}
