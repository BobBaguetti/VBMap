// scripts/modules/markerManager.js
//
// Builds custom icons, popups, and per‑marker context‑menu logic.

import { formatRarity }    from "./utils.js";
import { showContextMenu } from "./uiManager.js";

/* ─────────── Icon ─────────── */
export function createCustomIcon(m) {
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${m.imageSmall ? `<img src="${m.imageSmall}" class="marker-icon"/>` : ""}
      </div>`,
    className:"custom-marker-container",
    iconSize:[32,32]
  });
}

/* ─────────── Popup HTML ─────────── */
export function createPopupContent(m) {
  const name = `<h3 style="margin:0;font-size:20px;color:${m.nameColor||"#E5E6E8"}">${m.name}</h3>`;
  const big  = m.imageBig ? `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px">` : "";
  const video= m.videoURL ? `<button class="more-info-btn" onclick="openVideoPopup(event.clientX,event.clientY,'${m.videoURL}')">Play Video</button>` : "";

  let itemBits="";
  if (m.type==="Item") {
    if (m.itemType) itemBits += `<div style="color:${m.itemTypeColor||"#E5E6E8"}">${m.itemType}</div>`;
    if (m.rarity)   itemBits += `<div style="color:${m.rarityColor||"#E5E6E8"}">${formatRarity(m.rarity)}</div>`;
  }
  const desc  = m.description ? `<p style="color:${m.descriptionColor||"#E5E6E8"}">${m.description}</p>` : "";
  const extra = (m.extraLines||[]).map(l=>`<p style="margin:0;color:${l.color||"#E5E6E8"}">${l.text}</p>`).join("");

  return `<div class="custom-popup">${big}${name}${itemBits}${desc}${extra}${video}</div>`;
}

/* ─────────── Create marker & context menu ─────────── */
export function createMarker(m, map, layers, callbacks={}) {
  const mo = L.marker(m.coords,{icon:createCustomIcon(m)})
    .bindPopup(createPopupContent(m),{className:"custom-popup-wrapper",maxWidth:350});

  layers[m.type].addLayer(mo);

  mo.on("contextmenu", ev => {
    const opts = [
      {
        text:"Edit Marker",
        action: clickEvt => callbacks.onEdit?.(mo,m,clickEvt)   // ← passes click event
      },
      {
        text:"Copy Marker",
        action: () => callbacks.onCopy?.(mo,m)
      },
      {
        text: mo.dragging?.enabled() ? "Disable Drag" : "Enable Drag",
        action: () => {
          if (mo.dragging.enabled()) mo.dragging.disable();
          else {
            mo.dragging.enable();
            mo.once("dragend", () => {
              m.coords=[mo.getLatLng().lat,mo.getLatLng().lng];
              callbacks.onDragEnd?.(mo,m);
            });
          }
        }
      },
      {
        text:"Delete Marker",
        action: () => callbacks.onDelete?.(mo,m)
      }
    ];
    showContextMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });
  return mo;
}
