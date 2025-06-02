// @file: src/modules/map/marker/popups/itemPopup.js
// @version: 1.5 — use goldColor for coins icon

import { formatRarity } from "../../../../shared/utils/utils.js";
import { defaultNameColor, rarityColors, goldColor } from "../../../../shared/utils/color/colorPresets.js";
import { getBestImageUrl } from "../utils.js";

export function renderItemPopup(m) {
  // Choose only the large or small image (no more imageBig)
  const imgUrl = getBestImageUrl(m, "imageLarge", "imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${m.rarityColor || defaultNameColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML    = `<div class="popup-name" style="color:${m.nameColor || defaultNameColor};">
                         ${m.name || "Unnamed"}
                       </div>`;
  const typeHTML    = m.itemType
    ? `<div class="popup-type" style="color:${m.itemTypeColor || defaultNameColor};">
         ${m.itemType}
       </div>`
    : "";
  const rarityHTML  = m.rarity
    ? `<div class="popup-rarity" style="color:${m.rarityColor || defaultNameColor};">
         ${formatRarity(m.rarity)}
       </div>`
    : "";

  // valueHTML now uses goldColor for the coins icon
  const valueHTML   = m.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${m.value}</span>
         <i class="fas fa-coins" style="color:${goldColor};"></i>
       </div>`
    : "";

  const descHTML    = m.description
    ? `<p class="popup-desc" style="color:${m.descriptionColor || defaultNameColor};">
         ${m.description}
       </p>`
    : "";
  const extraHTML   = (m.extraLines || [])
    .map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">
                  ${l.text}
                </p>`)
    .join("");
  const qtyHTML     = m.quantity
    ? `<div class="popup-quantity-icon" title="Quantity">
         <span class="popup-quantity-number">${m.quantity}</span>
         <i class="fas fa-stack"></i>
       </div>`
    : "";

  return `
    <div class="custom-popup">
      <span class="popup-close-btn">✖</span>
      <div class="popup-container popup-item">
        <div class="popup-header">
          <div class="popup-header-left">
            ${bigImg}
            <div class="popup-info">
              ${nameHTML}${typeHTML}${rarityHTML}
            </div>
          </div>${valueHTML}
        </div>
        <div class="popup-body popup-info-box">
          ${descHTML}
          <hr class="popup-divider">
          ${extraHTML}${qtyHTML}
        </div>
      </div>
    </div>`;
}
