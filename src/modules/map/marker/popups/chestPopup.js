// @file: src/modules/map/marker/popups/chestPopup.js
// @version: 1.8 — place data-id on both <div class="chest-slot"> and its <img> so hover finds it reliably

import { formatRarity } from "../../../../shared/utils/utils.js";
import {
  rarityColors,
  defaultNameColor
} from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../utils.js";
import definitionsManager from "../../../../bootstrap/definitionsManager.js";

export function renderChestPopup(typeDef) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // 1) Compute chest rarity from category & size
  const cat           = typeDef.category   || "Normal";
  const size          = typeDef.size       || "Small";
  const rarityKey     = CHEST_RARITY[cat]?.[size] || "common";
  const rarityLabel   = formatRarity(rarityKey);
  const rarityColor   = rarityColors[rarityKey] || defaultNameColor;

  // 2) Header (icon + Name, Category, Rarity)
  const imgUrl    = typeDef.imageLarge || typeDef.imageSmall || "";
  const bigImg    = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${rarityColor}"
             onerror="this.style.display='none'">`
    : "";

  const titleColor    = typeDef.nameColor     || rarityColor;
  const categoryColor = typeDef.categoryColor || defaultNameColor;

  const nameHTML   = `<div class="popup-name" style="color:${titleColor};">
                        ${typeDef.name || ""}
                      </div>`;
  const typeHTML   = `<div class="popup-type" style="color:${categoryColor};">
                        ${cat}
                      </div>`;
  const rarityHTML = `<div class="popup-rarity" style="color:${rarityColor};">
                        ${rarityLabel}
                      </div>`;

  // 3) Loot grid (5 columns)
  const COLS = 5;
  const pool = Array.isArray(typeDef.lootPool) ? typeDef.lootPool : [];
  let cells = pool.map((it, idx) => {
    let item = it;
    if (!item.imageSmall && item.id) {
      const itemMap = definitionsManager.getDefinitions("Item");
      if (itemMap[item.id]) item = itemMap[item.id];
    }

    const slotImg = item.imageSmall || item.imageLarge || "";
    const clr = item.rarityColor
      || rarityColors[(item.rarity || "").toLowerCase()]
      || defaultNameColor;

    // Put data-id on BOTH the <div> and the <img>
    return `
      <div class="chest-slot" data-index="${idx}" data-id="${item.id || ''}"
           style="border-color:${clr}">
        <img src="${slotImg}"
             class="chest-slot-img"
             data-id="${item.id || ''}"
             onerror="this.style.display='none'">
        ${item.quantity > 1
          ? `<span class="chest-slot-qty">${item.quantity}</span>`
          : ""}
      </div>`;
  }).join("");

  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index="" data-id=""></div>`;
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
    .map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
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
