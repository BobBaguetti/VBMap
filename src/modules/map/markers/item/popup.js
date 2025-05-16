/* @file: src/modules/map/markers/item/popup.js */
/* @version: 1.0 — refactored from src/modules/map/marker/popups/itemPopup.js */

import { wrapPopup } from "../common/popupBase.js";
import { formatRarity } from "../../../utils/utils.js";
import { createIcon } from "../../../utils/iconUtils.js";
import { defaultNameColor, rarityColors } from "../../../utils/colorPresets.js";
import { isImgUrl, getBestImageUrl } from "../utils.js";

export default function renderItemPopup(def) {
  // Determine best image URL
  const imgUrl = getBestImageUrl(def, "imageBig", "imageLarge", "imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${def.rarityColor || defaultNameColor}"
             onerror="this.style.display='none'"/>`
    : "";

  // Header parts
  const nameHTML   = `<div class="popup-name" style="color:${def.nameColor || defaultNameColor};">${def.name || "Unnamed"}</div>`;
  const typeHTML   = def.itemType
    ? `<div class="popup-type" style="color:${def.itemTypeColor || defaultNameColor};">${def.itemType}</div>`
    : "";
  const rarityHTML = def.rarity
    ? `<div class="popup-rarity" style="color:${def.rarityColor || defaultNameColor};">${formatRarity(def.rarity)}</div>`
    : "";
  const valueHTML  = def.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${def.value}</span>
         ${createIcon("coins",{inline:true}).outerHTML}
       </div>`
    : "";

  // Body parts
  const descHTML     = def.description
    ? `<p class="popup-desc" style="color:${def.descriptionColor || defaultNameColor};">${def.description}</p>`
    : "";
  const extraHTML    = (def.extraLines || [])
    .map(l => `<p class="popup-extra-line" style="color:${l.color || defaultNameColor};">${l.text}</p>`)
    .join("");
  const quantityHTML = def.quantity
    ? `<div class="popup-quantity-icon" title="Quantity">
         <span class="popup-quantity-number">${def.quantity}</span>
         ${createIcon("stack",{inline:true}).outerHTML}
       </div>`
    : "";

  // Assemble inner HTML
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
        <hr class="popup-divider"/>
        ${extraHTML}${quantityHTML}
      </div>
    </div>
  `;

  return wrapPopup(inner);
}
