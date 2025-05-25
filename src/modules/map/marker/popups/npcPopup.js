// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.3 — default missing fields, render empty loot slots, color tier, and show Damage/HP

import { defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Renders an HTML string for NPC markers on the map
 * and in previews, with sensible defaults.
 *
 * @param {Object} def NPC definition data
 * @returns {string} HTML content for Leaflet popup
 */
export function renderNpcPopup(def = {}) {
  // 1) Safe defaults
  const nameText        = def.name        || "Unnamed";
  const disposition     = def.disposition || "Friendly";
  const factionText     = def.faction     || "";
  const tierText        = def.tier        || "";
  const dmgText         = def.damage      != null ? def.damage : "";
  const hpText          = def.hp          != null ? def.hp : "";
  const pool            = Array.isArray(def.lootPool) ? def.lootPool : [];
  const descriptionText = def.description || "";
  const extraLines      = Array.isArray(def.extraLines) ? def.extraLines : [];
  const imgUrl          = def.imageLarge || def.imageSmall || "";

  // Colors
  const dispositionColor = def.dispositionColor
    || (disposition === "Hostile" ? "#d9534f" : "#5cb85c")
    || defaultNameColor;
  const nameColor = def.nameColor     || defaultNameColor;
  const tierColor = def.tierColor     || defaultNameColor;

  // 2) Build header HTML
  const imgHTML = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${dispositionColor}"
             onerror="this.style.display='none'">`
    : "";
  const nameHTML = `<div class="popup-name" style="color:${nameColor}">${nameText}</div>`;
  const factionHTML = factionText
    ? `<div class="popup-type" style="color:${dispositionColor}">${factionText}</div>`
    : "";
  const tierHTML = tierText
    ? `<div class="popup-rarity" style="color:${tierColor}">${tierText}</div>`
    : "";

  // 3) Build Damage/HP block (right side, similar to item value)
  const statsHTML = (dmgText || hpText)
    ? `<div class="popup-value-icon" title="Stats">
         ${dmgText !== "" ? `<span>DMG: ${dmgText}</span>` : ""}
         ${hpText  !== "" ? `<span>HP: ${hpText}</span>`   : ""}
       </div>`
    : "";

  // 4) Build loot grid (5 columns, always show empty slots)
  const COLS = 5;
  let cells = pool.map((item, idx) => {
    const thumb = item.imageSmall || item.imageLarge || "";
    return `
      <div class="chest-slot" data-index="${idx}">
        ${thumb ? `<img src="${thumb}" class="chest-slot-img" onerror="this.style.display='none'">` : ""}
      </div>`;
  }).join("");
  for (let i = pool.length; i < COLS; i++) {
    cells += `<div class="chest-slot" data-index=""></div>`;
  }
  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // 5) Description & extra-info
  const descHTML = descriptionText
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">
         ${descriptionText}
       </p>`
    : "";
  const extraHTML = extraLines
    .map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">${l.text}</p>`)
    .join("");
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">
         ${descHTML}
         ${descHTML && extraHTML ? '<hr class="popup-divider">' : ''}
         ${extraHTML}
       </div>`
    : "";

  // 6) Assemble and return
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
