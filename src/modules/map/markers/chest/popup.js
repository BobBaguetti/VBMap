/* @file: src/modules/map/markers/chest/popup.js */
/* @version: 1.0 — refactored from src/modules/map/marker/popups/chestPopup.js */

import { wrapPopup } from "../common/popupBase.js";
import { formatRarity } from "../../../utils/utils.js";
import { rarityColors, defaultNameColor } from "../../../utils/colorPresets.js";
import { CHEST_RARITY } from "../utils.js";

export default function renderChestPopup(def) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Compute rarity
  const cat = def.category || "Normal";
  const size = def.size || "Small";
  const key = CHEST_RARITY[cat]?.[size] || "common";
  const rarityLabel = formatRarity(key);
  const rarityColor = rarityColors[key] || defaultNameColor;

  // Header
  const bigImg = def.imageSmall || def.imageLarge
    ? `<img src="${def.imageSmall || def.imageLarge}" class="popup-image"
             style="border-color:${rarityColor}"
             onerror="this.style.display='none'"/>`
    : "";
  const titleColor = def.nameColor || rarityColor;
  const nameHTML = `<div class="popup-name" style="color:${titleColor};">${def.name || ""}</div>`;
  const typeHTML = `<div class="popup-type">${cat}</div>`;
  const rarityHTML = `<div class="popup-rarity" style="color:${rarityColor};">${rarityLabel}</div>`;

  // Loot grid
  const COLS = 5;
  const pool = def.lootPool || [];
  let cells = "";
  pool.forEach((it, idx) => {
    const clr = it.rarityColor
      || rarityColors[(it.rarity || "").toLowerCase()]
      || defaultNameColor;
    cells += `<div class="chest-slot" data-index="${idx}" style="border-color:${clr}">
                <img src="${it.imageSmall || ""}" class="chest-slot-img"/>
                ${it.quantity > 1 ? `<span class="chest-slot-qty">${it.quantity}</span>` : ""}
              </div>`;
  });
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index=""></div>`;
  }
  const lootBox = `<div class="popup-info-box loot-box"><div class="chest-grid" style="--cols:${COLS};">${cells}</div></div>`;

  // Description & extra-info
  const descHTML = def.description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">${def.description}</p>`
    : "";
  const extraHTML = (def.extraLines || []).map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">${l.text}</p>`).join("");
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">${descHTML}${descHTML && extraHTML ? '<hr class="popup-divider"/>' : ''}${extraHTML}</div>`
    : "";

  const inner = `
    <div class="popup-header">
      <div class="popup-header-left">
        ${bigImg}
        <div class="popup-info">
          ${nameHTML}${typeHTML}${rarityHTML}
        </div>
      </div>
    </div>
    ${lootBox}
    ${textBox}
  `;

  return wrapPopup(inner);
}
