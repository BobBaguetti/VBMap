// scripts/modules/markerManager.js
//
// Creates map markers & popups, with safe image handling.

import { formatRarity } from "./utils.js";

/* ——— helper: basic URL test ——— */
function looksLikeUrl(str) {
  return /^https?:\/\/.+|^\/.+\.(png|jpe?g|gif|webp)$/i.test(str || "");
}

/* ——— ICON ——— */
export function createCustomIcon(m) {
  const hasImg = looksLikeUrl(m.imageSmall);
  const imgHTML = hasImg
    ? `<img src="${m.imageSmall}"
             class="marker-icon"
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

/* ——— POPUP ——— */
export function createPopupContent(m) {
  let itemTypeHTML = "",
    rarityHTML = "",
    descHTML = "",
    extraHTML = "";

  if (m.type === "Item") {
    if (m.itemType)
      itemTypeHTML = `<div style="color:${m.itemTypeColor || "#E5E6E8"}">
        ${m.itemType}</div>`;
    if (m.rarity)
      rarityHTML = `<div style="color:${m.rarityColor || "#E5E6E8"}">
        ${formatRarity(m.rarity)}</div>`;
    if (m.description)
      descHTML = `<p style="color:${m.descriptionColor || "#E5E6E8"}">
        ${m.description}</p>`;
    if (m.extraLines?.length)
      m.extraLines.forEach(
        l =>
          (extraHTML += `<p style="color:${l.color || "#E5E6E8"}">${l.text}</p>`)
      );
  } else if (m.description) {
    descHTML = `<p style="color:${m.descriptionColor || "#E5E6E8"}">
      ${m.description}</p>`;
  }

  const nameHTML = `<h3 style="color:${m.nameColor || "#E5E6E8"}">
      ${m.name}</h3>`;
  const bigImg = looksLikeUrl(m.imageBig)
    ? `<img src="${m.imageBig}"
             style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;"
             onerror="this.style.display='none'">`
    : "";
  const videoBtn = m.videoURL
    ? `<button class="more-info-btn"
              onclick="openVideoPopup(event.clientX,event.clientY,'${m.videoURL}')">
         Play Video</button>`
    : "";

  return `
    <div class="custom-popup">
      <div class="popup-header" style="display:flex;gap:5px">
        ${bigImg}
        <div style="margin-left:5px">
          ${nameHTML}${itemTypeHTML}${rarityHTML}
        </div>
      </div>
      <div class="popup-body">
        ${descHTML}${extraHTML}${videoBtn}
      </div>
    </div>`;
}

/* ——— add marker to map & context menu hooks ——— */
export function createMarker(m, map, layers, ctxMenu, cbs = {}) {
  const markerObj = L.marker(m.coords, {
    icon: createCustomIcon(m),
    draggable: false
  });

  markerObj.bindPopup(createPopupContent(m), {
    className: "custom-popup-wrapper",
    maxWidth: 350
  });

  layers[m.type].addLayer(markerObj);

  markerObj.on("contextmenu", evt => {
    evt.originalEvent.preventDefault();
    const opts = [
      {
        text: "Edit Marker",
        action: () => cbs.onEdit?.(markerObj, m, evt.originalEvent)
      },
      {
        text: "Copy Marker",
        action: () => cbs.onCopy?.(markerObj, m, evt.originalEvent)
      },
      {
        text: markerObj.dragging?.enabled() ? "Disable Drag" : "Enable Drag",
        action: () => {
          if (markerObj.dragging?.enabled()) markerObj.dragging.disable();
          else {
            markerObj.dragging.enable();
            markerObj.once("dragend", () => {
              m.coords = [markerObj.getLatLng().lat, markerObj.getLatLng().lng];
              cbs.onDragEnd?.(markerObj, m);
            });
          }
        }
      },
      {
        text: "Delete Marker",
        action: () => cbs.onDelete?.(markerObj, m)
      }
    ];
    ctxMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, opts);
  });

  return markerObj;
}
