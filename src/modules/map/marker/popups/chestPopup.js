// @file: src/modules/map/marker/popups/chestPopup.js
// @version: 1.1 — fallback to imageLarge & hide broken imgs

import { formatRarity } from "../../../../shared/utils/utils.js";
import { rarityColors, defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../utils.js";

export function renderChestPopup(typeDef) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // 1) Compute chest rarity from category & size
  const cat  = typeDef.category || "Normal";
  const size = typeDef.size     || "Small";
  const key  = CHEST_RARITY[cat]?.[size] || "common";
  const rarityLabel = formatRarity(key);
  const rarityColor = rarityColors[key] || defaultNameColor;

  // 2) Header (icon + Name, Category, Rarity)
  const bigImg = typeDef.imageSmall || typeDef.imageLarge
    ? `<img src="${typeDef.imageSmall || typeDef.imageLarge}"
            class="popup-image"
            style="border-color:${rarityColor}"
            onerror="this.style.display='none'">`
    : "";

  const titleColor = typeDef.nameColor || rarityColor;
  const nameHTML = `
    <div class="popup-name" style="color:${titleColor};">
      ${typeDef.name || ""}
    </div>`;
  const typeHTML   = `<div class="popup-type">${cat}</div>`;
  const rarityHTML = `
    <div class="popup-rarity" style="color:${rarityColor};">
      ${rarityLabel}
    </div>`;

  // 3) Loot grid (5 columns)
  const COLS = 5;
  const pool = typeDef.lootPool || [];
  let cells = "";
  pool.forEach((it, idx) => {
    const clr = it.rarityColor
      || rarityColors[(it.rarity || "").toLowerCase()]
      || defaultNameColor;

    // use imageSmall if present, otherwise imageLarge; hide on error
    const imgSrc = it.imageSmall || it.imageLarge || "";
    cells += `
      <div class="chest-slot" data-index="${idx}"
           style="border-color:${clr}">
        <img src="${imgSrc}"
             class="chest-slot-img"
             onerror="this.style.display='none'">
        ${it.quantity > 1
          ? `<span class="chest-slot-qty">${it.quantity}</span>`
          : ""
        }
      </div>`;
  });

  // fill remaining empty slots
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index=""></div>`;
  }

  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // 4) Description & extra-info
  const descHTML = typeDef.description
    ? `<p class="popup-desc" style="color:${typeDef.descriptionColor || defaultNameColor};">
         ${typeDef.description}
       </p>`
    : "";
  const extraHTML = (typeDef.extraLines || [])
    .map(l => `
      <p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
        ${l.text}
      </p>`)
    .join("");
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">
         ${descHTML}
         ${descHTML && extraHTML ? '<hr class="popup-divider">' : ''}
         ${extraHTML}
       </div>`
    : "";

  // 5) Assemble and return
  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
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
    </div>`;
}
