// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.10 — add data-id attributes so hover popups map correctly

import {
  defaultNameColor,
  dispositionColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";
import { createIcon } from "../../../../shared/utils/iconUtils.js";
import definitionsManager from "../../../../bootstrap/definitionsManager.js";

export function renderNpcPopup(def = {}) {
  // Safe defaults
  const nameText    = def.name        || "Unnamed";
  const disposition = def.disposition || "";
  const factionText = def.faction     || "";
  const tierText    = def.tier        || "";
  const dmgText     = def.damage      != null ? def.damage : "";
  const hpText      = def.hp          != null ? def.hp : "";
  const pool        = Array.isArray(def.lootPool) ? def.lootPool : [];
  const description = def.description || "";
  const extras      = Array.isArray(def.extraLines) ? def.extraLines : [];
  const imgUrl      = def.imageLarge || def.imageSmall || "";

  // Determine text colors
  const nameColor = def.nameColor || defaultNameColor;
  const factionColor = def.factionColor
    || dispositionColors[disposition]
    || defaultNameColor;
  const tierColor = def.tierColor
    || tierColors[tierText]
    || defaultNameColor;

  // Determine image border color: Friendly → factionColor; else → tierColor
  const imageBorderColor = disposition === "Friendly"
    ? factionColor
    : tierColor;

  // 1) Header image with updated border logic
  const imgHTML = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${imageBorderColor}"
             onerror="this.style.display='none'">`
    : "";

  // 2) Name / faction / tier
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

  // 3) Stats icons
  const statsItems = [];
  if (dmgText !== "") {
    statsItems.push(
      `<span class="popup-value-number">${dmgText}</span>` +
      createIcon("sword", { inline: true }).outerHTML
    );
  }
  if (hpText !== "") {
    statsItems.push(
      `<span class="popup-value-number">${hpText}</span>` +
      createIcon("heart", { inline: true }).outerHTML
    );
  }
  const statsHTML = statsItems.length
    ? `<div class="popup-value-icon" title="Stats">
         ${statsItems.join("")}
       </div>`
    : "";

  // 4) Loot grid (5 columns) — now matching chestPopup style
  const COLS = 5;
  let cells = pool.map((it, idx) => {
    let item = it;
    if (!item.imageSmall && item.id) {
      const itemMap = definitionsManager.getDefinitions("Item");
      if (itemMap[item.id]) item = itemMap[item.id];
    }

    const slotImg = item.imageSmall || item.imageLarge || "";
    const clr = item.rarityColor || defaultNameColor;

    // Add data-id so hover logic finds the correct item
    return `
      <div class="chest-slot" data-index="${idx}"
           style="border-color:${clr}">
        <img src="${slotImg}"
             class="chest-slot-img"
             data-id="${item.id || ""}"
             onerror="this.style.display='none'">
        ${item.quantity > 1
          ? `<span class="chest-slot-qty">${item.quantity}</span>`
          : ""}
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

  // 5) Description & extra info
  const descHTML = description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">
         ${description}
       </p>`
    : "";
  const extraHTML = extras.map(l =>
    `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
       ${l.text}
     </p>`
  ).join("");
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
