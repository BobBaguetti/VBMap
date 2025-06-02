// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.10 — assume pool is already hydrated; drop data-index

import {
  defaultNameColor,
  dispositionColors,
  tierColors,
  rarityColors
} from "../../../../shared/utils/color/colorPresets.js";
import definitionsManager from "../../../../bootstrap/definitionsManager.js";
import { renderItemPopup } from "./itemPopup.js";

/**
 * Renders HTML for an NPC popup. Assumes `def.lootPool` is already
 * an array of { id, name, imageSmall, quantity, rarity, … } via enrichLootPool.
 *
 * @param {Object} def  — NPC definition data
 * @returns {string} HTML for Leaflet popup
 */
export function renderNpcPopup(def = {}) {
  // Safe defaults
  const nameText    = def.name        || "Unnamed";
  const disposition = def.disposition || "";
  const factionText = def.faction     || "";
  const tierText    = def.tier        || "";
  const dmgText     = def.damage      != null ? def.damage : "";
  const hpText      = def.hp          != null ? def.hp : "";
  const description = def.description || "";
  const extras      = Array.isArray(def.extraLines) ? def.extraLines : [];
  const imgUrl      = def.imageLarge || def.imageSmall || "";

  // 1) Header image & colors
  const nameColor = def.nameColor || defaultNameColor;
  const factionColor = def.factionColor
    || dispositionColors[disposition]
    || defaultNameColor;
  const tierColor = def.tierColor
    || tierColors[tierText]
    || defaultNameColor;

  // Border: Friendly → factionColor, else → tierColor
  const imageBorderColor = disposition === "Friendly"
    ? factionColor
    : tierColor;

  const imgHTML = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${imageBorderColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `<div class="popup-name" style="color:${nameColor}">
                      ${nameText}
                    </div>`;
  const factionHTML = factionText
    ? `<div class="popup-type" style="color:${factionColor}">
         ${factionText}
       </div>`
    : "";
  const tierHTML = tierText
    ? `<div class="popup-rarity" style="color:${tierColor}">
         ${tierText}
       </div>`
    : "";

  // 2) Stats icons (damage & HP)
  const statsItems = [];
  if (dmgText !== "") {
    statsItems.push(
      `<span class="popup-value-number">${dmgText}</span>` +
      `<svg class="icon inline-icon"><use xlink:href="#icon-sword"></use></svg>`
    );
  }
  if (hpText !== "") {
    statsItems.push(
      `<span class="popup-value-number">${hpText}</span>` +
      `<svg class="icon inline-icon"><use xlink:href="#icon-heart"></use></svg>`
    );
  }
  const statsHTML = statsItems.length
    ? `<div class="popup-value-icon" title="Stats">
         ${statsItems.join("")}
       </div>`
    : "";

  // 3) Loot grid (5 columns)
  // Assume `def.lootPool` is already an array of full item objects
  const pool = Array.isArray(def.lootPool) ? def.lootPool : [];
  const COLS = 5;
  let cells = pool
    .map(item => {
      const thumb = item.imageSmall || item.imageLarge || "";
      const clr   = item.rarityColor
        || rarityColors[(item.rarity || "").toLowerCase()]
        || defaultNameColor;

      return `
        <div class="npc-slot" data-item-id="${item.id}" style="border-color:${clr}">
          <img src="${thumb}" class="npc-slot-img" onerror="this.style.display='none'">
          ${item.quantity > 1
            ? `<span class="npc-slot-qty">${item.quantity}</span>`
            : ""}
        </div>`;
    })
    .join("");

  // Fill remaining slots if fewer than COLS
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="npc-slot" data-item-id="" style="border-color:transparent"></div>`;
  }

  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // 4) Description & extra-info
  const descHTML = description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">
         ${description}
       </p>`
    : "";
  const extraHTML = extras
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

  // 5) Assemble and return HTML
  return `
    <div class="custom-popup" style="position:relative;">
      <span class="popup-close-btn">✖</span>
      <div class="popup-header">
        <div class="popup-header-left">
          ${imgHTML}
          <div class="popup-info">
            ${nameHTML}${factionHTML}${tierHTML}
          </div>
        </div>
        ${statsHTML}
      </div>
      ${lootBox}
      ${textBox}
    </div>`;
}
