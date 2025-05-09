// @file: src/modules/map/marker/popups/itemPopup.js
// @version: 1.0 — extract renderPopup into its own module

import { formatRarity } from "../../../utils/utils.js";
import { createIcon } from "../../../utils/iconUtils.js";
import { defaultNameColor, rarityColors } from "../../../utils/colorPresets.js";
import { isImgUrl, getBestImageUrl } from "../utils.js";

export function renderItemPopup(m) {
  const imgUrl = getBestImageUrl(m, "imageBig","imageLarge","imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${m.rarityColor||defaultNameColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `
    <div class="popup-name" style="color:${m.nameColor||defaultNameColor};">
      ${m.name||"Unnamed"}
    </div>`;

  const typeHTML = m.itemType
    ? `<div class="popup-type" style="color:${m.itemTypeColor||defaultNameColor};">
         ${m.itemType}
       </div>`
    : "";

  const rarityHTML = m.rarity
    ? `<div class="popup-rarity" style="color:${m.rarityColor||defaultNameColor};">
         ${formatRarity(m.rarity)}
       </div>`
    : "";

  const valueHTML = m.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${m.value}</span>
         ${createIcon("coins",{inline:true}).outerHTML}
       </div>`
    : "";

  const descHTML = m.description
    ? `<p class="popup-desc" style="color:${m.descriptionColor||defaultNameColor};">
         ${m.description}
       </p>`
    : "";

  const extraHTML = (m.extraLines||[])
    .map(line => `
      <p class="popup-extra-line" style="color:${line.color||defaultNameColor};">
        ${line.text}
      </p>`)
    .join("");

  const quantityHTML = m.quantity
    ? `<div class="popup-quantity-icon" title="Quantity">
         <span class="popup-quantity-number">${m.quantity}</span>
         ${createIcon("stack",{inline:true}).outerHTML}
       </div>`
    : "";

  return `
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
        ${extraHTML}${quantityHTML}
      </div>
    </div>`;
}
