// @file: src/modules/map/marker/popups/chestPopup.js
// @version: 1.6 — always hydrate lootPool into full item‐objects for hover/popups

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
  // ─────────────────────────────────────────────────────────────────────────────
  // First, “hydrate” pool into full item‐objects, whether the definition
  // stored IDs (strings) or (older) full‐object entries.
  const rawPool = Array.isArray(typeDef.lootPool) ? typeDef.lootPool : [];
  const itemMap  = definitionsManager.getDefinitions("Item");
  const pool = rawPool
    .map(entry => {
      // If it’s a string → look it up in itemMap
      if (typeof entry === "string") {
        return itemMap[entry] || null;
      }
      // If it’s already an object with an .id → re‐lookup in itemMap
      if (entry && entry.id) {
        return itemMap[entry.id] || null;
      }
      // Otherwise, can’t resolve it
      return null;
    })
    .filter(Boolean); // drop any nulls (unresolvable IDs)

  const COLS = 5;
  let cells = pool
    .map((item, idx) => {
      // Now `item` is guaranteed to be a full object from itemMap.
      // We can safely read .imageSmall, .rarity, .quantity, etc.
      const slotImg = item.imageSmall || item.imageLarge || "";
      const clr     = item.rarityColor
        || rarityColors[(item.rarity || "").toLowerCase()]
        || defaultNameColor;

      return `
        <div class="chest-slot" data-index="${idx}"
             data-item-id="${item.id}"
             style="border-color:${clr}">
          <img src="${slotImg}"
               class="chest-slot-img"
               onerror="this.style.display='none'">
          ${item.quantity > 1
            ? `<span class="chest-slot-qty">${item.quantity}</span>`
            : ""}
        </div>`;
    })
    .join("");

  // Fill the remaining columns with empty slots
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index="" data-item-id=""></div>`;
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
