// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.3 — default values for missing fields & empty loot slots

import { defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Renders an HTML string for NPC markers on the map,
 * coloring the faction text based on disposition,
 * and handling missing fields & empty lootPool.
 *
 * @param {Object} def NPC definition data
 * @returns {string} HTML content for Leaflet popup
 */
export function renderNpcPopup(def) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // 1) Header image
  const imgUrl = def.imageSmall || def.imageLarge || "";
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image" onerror="this.style.display='none'">`
    : "";

  // 2) Fallback values
  const nameVal    = def.name    || "Unnamed";
  const factionVal = def.faction || "";
  const tierVal    = def.tier    || "";

  // 3) Colors
  const titleColor       = def.nameColor || defaultNameColor;
  const dispositionColor = def.dispositionColor
    || (def.disposition === "Hostile" ? "#d9534f" : "#5cb85c")
    || defaultNameColor;

  // 4) Name, faction, tier HTML
  const nameHTML    = `<div class="popup-name" style="color:${titleColor}">${nameVal}</div>`;
  const factionHTML = factionVal
    ? `<div class="popup-type" style="color:${dispositionColor}">${factionVal}</div>`
    : "";
  const tierHTML    = tierVal
    ? `<div class="popup-rarity">${tierVal}</div>`
    : "";

  // 5) Loot grid with empty slots
  const pool = Array.isArray(def.lootPool) ? def.lootPool : [];
  const COLS = 5;
  let cells = pool.map((item, idx) => {
    const thumb = item.imageSmall
      ? `<img src="${item.imageSmall}" class="chest-slot-img" onerror="this.style.display='none'">`
      : "";
    return `<div class="chest-slot" data-index="${idx}">${thumb}</div>`;
  }).join("");
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

  // 6) Description & extra-info
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

  // 7) Assemble full popup
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
    </div>`;
}
