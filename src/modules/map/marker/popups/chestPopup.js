// @file: src/modules/map/marker/popups/chestPopup.js
// @version: 1.7 — assume lootPool is always Array<string> (IDs only)

import { formatRarity } from "../../../../shared/utils/utils.js";
import {
  rarityColors,
  defaultNameColor
} from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../utils.js";
import definitionsManager from "../../../../bootstrap/definitionsManager.js";

/**
 * Generate the HTML for a chest popup. We assume
 *   typeDef.lootPool === Array<string> (IDs only).
 *
 * @param {Object} typeDef — the chest definition object from Firestore
 *   Properties include: name, category, size, lootPool (Array of strings), imageSmall/Large, etc.
 * @returns {string} an HTML string for the Leaflet/Map popup
 */
export function renderChestPopup(typeDef) {
  // ─── Close button & rarity calculations ────────────────────────────────────
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Determine chest rarity from category + size:
  const cat         = typeDef.category   || "Normal";
  const size        = typeDef.size       || "Small";
  const rarityKey   = CHEST_RARITY[cat]?.[size] || "common";
  const rarityLabel = formatRarity(rarityKey);
  const rarityColor = rarityColors[rarityKey] || defaultNameColor;

  // Image on left (large or small), with border color = rarityColor
  const imgUrl = typeDef.imageLarge || typeDef.imageSmall || "";
  const bigImg = imgUrl
    ? `<img src="${imgUrl}"
             class="popup-image"
             style="border-color:${rarityColor}"
             onerror="this.style.display='none'">`
    : "";

  // Title & category colors
  const titleColor    = typeDef.nameColor     || rarityColor;
  const categoryColor = typeDef.categoryColor || defaultNameColor;

  const nameHTML = `
    <div class="popup-name" style="color:${titleColor};">
      ${typeDef.name || ""}
    </div>`;

  const typeHTML = `
    <div class="popup-type" style="color:${categoryColor};">
      ${cat}
    </div>`;

  const rarityHTML = `
    <div class="popup-rarity" style="color:${rarityColor};">
      ${rarityLabel}
    </div>`;

  // ─── Build the loot grid (5 columns) ──────────────────────────────────────
  const COLS     = 5;
  const itemMap  = definitionsManager.getDefinitions("Item") || {};
  const poolArray = Array.isArray(typeDef.lootPool) ? typeDef.lootPool : [];

  const cells = poolArray.map((itemId, idx) => {
    // Look up the item object by its ID string
    const itemObj = itemMap[itemId];
    if (!itemObj) {
      // If the ID isn’t found (deleted or missing), render an empty slot
      return `
        <div class="chest-slot" data-index="${idx}" style="border-color:transparent">
          <!-- missing item -->
        </div>`;
    }

    // Determine the image to show (prefer imageSmall, fallback to imageLarge)
    const slotImg = itemObj.imageSmall || itemObj.imageLarge || "";

    // Determine border-color from the item’s rarity
    const itemRarityKey = (itemObj.rarity || "").toLowerCase();
    const clr = itemObj.rarityColor
      || rarityColors[itemRarityKey]
      || defaultNameColor;

    // Build the HTML for this single slot
    return `
      <div class="chest-slot" data-index="${idx}" style="border-color:${clr}">
        <img src="${slotImg}"
             class="chest-slot-img"
             onerror="this.style.display='none'">
        ${
          // If the item has quantity > 1, show the quantity badge
          itemObj.quantity && +itemObj.quantity > 1
            ? `<span class="chest-slot-qty">${itemObj.quantity}</span>`
            : ""
        }
      </div>`;
  }).join("");

  // Fill up to COLS with blank slots
  let filler = "";
  for (let i = poolArray.length; i < COLS; i++) {
    filler += `<div class="chest-slot" data-index="" style="border-color:transparent"></div>`;
  }

  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}${filler}
      </div>
    </div>`;

  // ─── Description & extra‐info (unchanged) ─────────────────────────────────
  const descHTML = typeDef.description
    ? `<p class="popup-desc" style="color:${typeDef.descriptionColor || defaultNameColor};">
         ${typeDef.description}
       </p>`
    : "";

  const extraHTML = (typeDef.extraLines || []).map(l =>
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

  // ─── Assemble and return the full popup HTML ───────────────────────────────
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
