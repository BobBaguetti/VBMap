// @file: /scripts/modules/map/markerManager.js

import { formatRarity } from "../utils/utils.js";
import { createIcon } from "../utils/iconUtils.js";

function isImgUrl(str) {
  return /^https?:\/\/.+|^\/.+\.(png|jpe?g|gif|webp)$/i.test(str || "");
}

export function renderPopup(m) {
  const nameHTML = `<div class="popup-name" style="color:${m.nameColor || "#E5E6E8"};">${m.name || "Unnamed Item"}</div>`;
  const bigImg = isImgUrl(m.imageBig)
    ? `<img src="${m.imageBig}" class="popup-image" style="border-color:${m.rarityColor || "#777"};" onerror="this.style.display='none'">`
    : "";

  const itemTypeHTML = m.itemType
    ? `<div class="popup-type" style="color:${m.itemTypeColor || "#E5E6E8"};">${m.itemType}</div>`
    : "";

  const rarityHTML = m.rarity
    ? `<div class="popup-rarity" style="color:${m.rarityColor || "#E5E6E8"};">${formatRarity(m.rarity)}</div>`
    : "";

  const valueHTML = m.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${m.value}</span>
         ${createIcon("coins", { inline: true }).outerHTML}
       </div>`
    : "";

  const descHTML = m.description
    ? `<p class="popup-desc" style="color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`
    : "";

  const extraHTML = (m.extraLines || []).map(line => `
    <p class="popup-extra-line" style="color:${line.color || "#E5E6E8"};">${line.text}</p>
  `).join("");

  const quantityHTML = m.quantity && m.quantity > 1
    ? `<p class="popup-meta">Quantity: ${m.quantity}</p>`
    : "";

  // custom close button markup
  const closeBtnHTML = `
    <span class="popup-close-btn" 
          style="
            position:absolute;
            top:8px;
            right:8px;
            cursor:pointer;
            padding:4px;
          ">
      ${createIcon("x", { inline: true }).outerHTML}
    </span>`;

  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtnHTML}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}
            ${itemTypeHTML}
            ${rarityHTML}
          </div>
        </div>
        ${valueHTML}
      </div>
      <div class="popup-body popup-info-box">
        ${descHTML}
        <hr class="popup-divider">
        ${extraHTML}
        ${quantityHTML}
      </div>
    </div>`;
}

export function createCustomIcon(m) {
  const imgHTML = isImgUrl(m.imageSmall)
    ? `<img src="${m.imageSmall}" class="marker-icon" onerror="this.style.display='none'">`
    : "";

  return L.divIcon({
    html: `<div class="custom-marker"><div class="marker-border"></div>${imgHTML}</div>`,
    className: "custom-marker-container",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}

export function createMarker(m, map, layers, ctxMenu, callbacks = {}) {
  const markerObj = L.marker(m.coords, {
    icon: createCustomIcon(m),
    draggable: false
  });

  markerObj.bindPopup(renderPopup(m), {
    className: "custom-popup-wrapper",
    maxWidth: 350,
    closeButton: false,
    offset: [0, -35]
  });

  markerObj.on("popupopen", () => {
    // wire up our custom close button
    const popupEl = document.querySelector(".custom-popup");
    const closeBtn = popupEl?.querySelector(".popup-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        markerObj.closePopup();
      });
    }
  });

  layers[m.type].addLayer(markerObj);

  markerObj.on("contextmenu", evt => {
    evt.originalEvent.preventDefault();
    const options = [
      {
        text: "Edit Marker",
        action: () => callbacks.onEdit?.(markerObj, m, evt.originalEvent)
      },
      {
        text: "Copy Marker",
        action: () => callbacks.onCopy?.(markerObj, m, evt.originalEvent)
      },
      {
        text: markerObj.dragging?.enabled() ? "Disable Drag" : "Enable Drag",
        action: () => {
          if (markerObj.dragging?.enabled()) {
            markerObj.dragging.disable();
          } else {
            markerObj.dragging.enable();
            markerObj.once("dragend", () => {
              m.coords = [markerObj.getLatLng().lat, markerObj.getLatLng().lng];
              callbacks.onDragEnd?.(markerObj, m);
            });
          }
        }
      },
      {
        text: "Delete Marker",
        action: () => callbacks.onDelete?.(markerObj, m)
      }
    ];
    ctxMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, options);
  });

  return markerObj;
}
