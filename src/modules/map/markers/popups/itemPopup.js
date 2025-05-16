// @file: src/modules/map/marker/popups/itemPopup.js
// @version: 1.2 — refactored to use popupBase wrapper

import popupBase from "../common/popupBase.js";
import { formatRarity } from "../../../utils/utils.js";
import { defaultNameColor, rarityColors } from "../../../utils/colorPresets.js";
import { isImgUrl, getBestImageUrl } from "../utils.js";

/**
 * Render the popup HTML for an Item marker, wrapped in popupBase.
 *
 * @param {Object} m – item definition
 * @returns {string} HTML for Leaflet bindPopup
 */
export function renderItemPopup(m) {
  const imgUrl = getBestImageUrl(m, "imageBig", "imageLarge", "imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${m.rarityColor || defaultNameColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `<div class="popup-name" style="color:${m.nameColor || defaultNameColor};">
                      ${m.name || "Unnamed"}
                    </div>`;
  const typeHTML = m.itemType
    ? `<div class="popup-type" style="color:${m.itemTypeColor || defaultNameColor};">
         ${m.itemType}
       </div>`
    : "";
  const rarityHTML = m.rarity
    ? `<div class="popup-rarity" style="color:${m.rarityColor || defaultNameColor};">
         ${formatRarity(m.rarity)}
       </div>`
    : "";
  const valueHTML = m.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${m.value}</span>
         <i class="fas fa-coins"></i>
       </div>`
    : "";
  const descHTML = m.description
    ? `<p class="popup-desc" style="color:${m.descriptionColor || defaultNameColor};">
         ${m.description}
       </p>`
    : "";
  const extraHTML = (m.extraLines || [])
    .map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
                 ${l.text}
               </p>`)
    .join("");
  const quantityHTML = m.quantity
    ? `<div class="popup-quantity-icon" title="Quantity">
         <span class="popup-quantity-number">${m.quantity}</span>
         <i class="fas fa-layer-group"></i>
       </div>`
    : "";

  // Inner content specific to Items
  const inner = `
    <div class="popup-container popup-item">
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}${typeHTML}${rarityHTML}
          </div>
        </div>
        ${valueHTML}
      </div>
      <div class="popup-body popup-info-box">
        ${descHTML}
        <hr class="popup-divider">
        ${extraHTML}${quantityHTML}
      </div>
    </div>
  `;

  // Wrap and return
  return popupBase(inner);
}
