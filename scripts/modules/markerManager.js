// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/markerManager.js
// Creates map markers & popups with safe images, a custom close‑button,
// uniform spacing, and synchronized font‑sizes for Item markers.

import { formatRarity } from "./utils.js";

// Basic URL check for images
function isImgUrl(str) {
  return /^https?:\/\/.+|^\/.+\.(png|jpe?g|gif|webp)$/i.test(str || "");
}

export function createCustomIcon(m) {
  const imgHTML = isImgUrl(m.imageSmall)
    ? `<img src="${m.imageSmall}" class="marker-icon"
            onerror="this.style.display='none'">`
    : "";

  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${imgHTML}
      </div>`,
    className: "custom-marker-container",
    iconSize: [32, 32]
  });
}

export function createPopupContent(m) {
  let itemTypeHTML = "", rarityHTML = "", descHTML = "", extraHTML = "";

  if (m.type === "Item") {
    if (m.itemType) itemTypeHTML = `
      <div style="margin:2px 0; font-size:18px; color:${m.itemTypeColor || "#E5E6E8"};">
        ${m.itemType}
      </div>`;
    if (m.rarity) rarityHTML = `
      <div style="margin:2px 0; font-size:18px; color:${m.rarityColor || "#E5E6E8"};">
        ${formatRarity(m.rarity)}
      </div>`;
    if (m.description) descHTML = `
      <p style="margin:2px 0; color:${m.descriptionColor || "#E5E6E8"};">
        ${m.description}
      </p>`;
    if (m.extraLines?.length) {
      m.extraLines.forEach(line => {
        extraHTML += `
          <p style="margin:2px 0; color:${line.color || "#E5E6E8"};">
            ${line.text}
          </p>`;
      });
    }
  } else if (m.description) {
    descHTML = `
      <p style="margin:2px 0; color:${m.descriptionColor || "#E5E6E8"};">
        ${m.description}
      </p>`;
  }

  const nameHTML = `
    <h3 style="margin:0; font-size:20px; color:${m.nameColor || "#E5E6E8"};">
      ${m.name}
    </h3>`;

  const bigImg = isImgUrl(m.imageBig)
    ? `<img src="${m.imageBig}" class="popup-image"
             style="width:64px; height:64px; object-fit:contain;
                    background:#222; border:2px solid #777; border-radius:4px;"
             onerror="this.style.display='none'">`
    : "";

  const videoBtn = m.videoURL ? `
    <button class="more-info-btn"
            onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">
      Play Video
    </button>` : "";

  return `
    <div class="custom-popup">
      <button class="popup-close-btn" onclick="this.closest('.leaflet-popup')._close()">
        ×
      </button>
      <div class="popup-header" style="display:flex; gap:5px;">
        ${bigImg}
        <div style="margin-left:5px;">
          ${nameHTML}
          ${itemTypeHTML}
          ${rarityHTML}
        </div>
      </div>
      <div class="popup-body">
        ${descHTML}
        ${extraHTML}
        ${videoBtn}
      </div>
    </div>`;
}

export function createMarker(m, map, layers, ctxMenu, callbacks = {}) {
  const markerObj = L.marker(m.coords, {
    icon: createCustomIcon(m),
    draggable: false
  });

  markerObj.bindPopup(createPopupContent(m), {
    className: "custom-popup-wrapper",
    maxWidth: 350,
    closeButton: false
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

// @version: 1