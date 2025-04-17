// scripts/modules/markerManager.js
//
// Creates map markers & popups with safe image handling and
// consistent popup spacing.

import { formatRarity } from "./utils.js";

/* ---------- URL sanity check ---------- */
function isImgUrl(str) {
  return /^https?:\/\/.+|^\/.+\.(png|jpe?g|gif|webp)$/i.test(str || "");
}

/* ---------- ICON ---------- */
export function createCustomIcon(m) {
  const imgTag = isImgUrl(m.imageSmall)
    ? `<img src="${m.imageSmall}" class="marker-icon"
            onerror="this.style.display='none'">`
    : "";

  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${imgTag}
      </div>`,
    className: "custom-marker-container",
    iconSize: [32, 32]
  });
}

/* ---------- POPUP ---------- */
export function createPopupContent(m) {
  /* item‑specific bits */
  let itemTypeHTML = "",
    rarityHTML = "",
    descHTML = "",
    extraHTML = "";

  if (m.type === "Item") {
    if (m.itemType)
      itemTypeHTML = `<div style="margin:2px 0;
          color:${m.itemTypeColor || "#E5E6E8"}">${m.itemType}</div>`;

    if (m.rarity)
      rarityHTML = `<div style="margin:2px 0;
          color:${m.rarityColor || "#E5E6E8"}">${formatRarity(m.rarity)}</div>`;

    if (m.description)
      descHTML = `<p style="margin:2px 0;
          color:${m.descriptionColor || "#E5E6E8"}">${m.description}</p>`;

    if (m.extraLines?.length)
      m.extraLines.forEach(
        l =>
          (extraHTML += `<p style="margin:2px 0;
              color:${l.color || "#E5E6E8"}">${l.text}</p>`)
      );
  } else if (m.description) {
    descHTML = `<p style="margin:2px 0;
        color:${m.descriptionColor || "#E5E6E8"}">${m.description}</p>`;
  }

  /* name + image + optional video button */
  const nameHTML = `<h3 style="margin:0;font-size:20px;
        color:${m.nameColor || "#E5E6E8"}">${m.name}</h3>`;

  const bigImg = isImgUrl(m.imageBig)
    ? `<img src="${m.imageBig}"
             style="width:64px;height:64px;object-fit:contain;
             border:2px solid #777;border-radius:4px;"
             onerror="this.style.display='none'">`
    : "";

  const videoBtn = m.videoURL
    ? `<button class="more-info-btn"
              onclick="openVideoPopup(event.clientX,event.clientY,'${m.videoURL}')">
         Play Video</button>`
    : "";

  /* assemble */
  return `
    <div class="custom-popup">
      <div class="popup-header" style="display:flex;gap:5px">
        ${bigImg}
        <div style="margin-left:5px">
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

/* ---------- Marker factory ---------- */
export function createMarker(m, map, layers, ctx, cbs = {}) {
  const markerObj = L.marker(m.coords, {
    icon: createCustomIcon(m),
    draggable: false
  });

  markerObj.bindPopup(createPopupContent(m), {
    className: "custom-popup-wrapper",
    maxWidth: 350
  });

  layers[m.type].addLayer(markerObj);

  markerObj.on("contextmenu", ev => {
    ev.originalEvent.preventDefault();
    const opts = [
      {
        text: "Edit Marker",
        action: () => cbs.onEdit?.(markerObj, m, ev.originalEvent)
      },
      {
        text: "Copy Marker",
        action: () => cbs.onCopy?.(markerObj, m, ev.originalEvent)
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
      { text: "Delete Marker", action: () => cbs.onDelete?.(markerObj, m) }
    ];
    ctx(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });

  return markerObj;
}
