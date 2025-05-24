// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.3 — graceful defaults & empty-slot grid in preview

import { defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Renders an HTML string for NPC markers on the map
 * and in the definition preview, coloring the faction text
 * based on disposition and showing a 5-slot loot grid.
 *
 * @param {Object} def NPC definition data
 * @returns {string} HTML content for Leaflet popup
 */
export function renderNpcPopup(def) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Safe defaults
  const name        = def.name || "Unnamed";
  const disposition = def.disposition || "";
  const faction     = def.faction || "";
  const tier        = def.tier || "";

  // Colors
  const titleColor       = def.nameColor || defaultNameColor;
  const dispositionColor = def.dispositionColor
    || (disposition === "Hostile" ? "#d9534f" : "#5cb85c")
    || defaultNameColor;

  // Header HTML
  const nameHTML    = `<div class="popup-name" style="color:${titleColor}">${name}</div>`;
  const factionHTML = faction
    ? `<div class="popup-type" style="color:${dispositionColor}">${faction}</div>`
    : "";
  const tierHTML    = tier
    ? `<div class="popup-rarity">${tier}</div>`
    : "";

  // Loot grid: 5 columns with empty slots if none
  const COLS = 5;
  const pool = Array.isArray(def.lootPool) ? def.lootPool : [];
  let cells = pool.map((item, idx) => {
    const imgUrl = item.imageSmall || item.imageLarge || "";
    return `
      <div class="chest-slot" data-index="${idx}">
        <img src="${imgUrl}"
             class="chest-slot-img"
             onerror="this.style.display='none'">
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

  // Description & extra info
  const descHTML = def.description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">
         ${def.description}
       </p>`
    : "";
  const extraHTML = Array.isArray(def.extraLines)
    ? def.extraLines.map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
                                ${l.text}
                              </p>`).join("")
    : "";
  const textBox = (descHTML || extraHTML)
    ? `<div class="popup-info-box">
         ${descHTML}
         ${descHTML && extraHTML ? "<hr class='popup-divider'>" : ""}
         ${extraHTML}
       </div>`
    : "";

  // Assemble and return the full popup
  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          <!-- NPCs have no header image -->
          <div class="popup-info">
            ${nameHTML}${factionHTML}${tierHTML}
          </div>
        </div>
      </div>
      ${lootBox}
      ${textBox}
    </div>`;
}
