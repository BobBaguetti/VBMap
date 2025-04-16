// markerUtils.js
// This module contains utility functions for markers, such as creating custom icons,
// building popup content, and formatting marker data.

export function formatRarity(val) {
  if (!val) return "";
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}

export function createCustomIcon(m) {
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${m.imageSmall ? `<img src="${m.imageSmall}" class="marker-icon"/>` : ""}
      </div>
    `,
    className: "custom-marker-container",
    iconSize: [32, 32]
  });
}

export function createPopupContent(m) {
  let itemTypeHTML = "";
  let rarityHTML = "";
  let descHTML = "";
  let extraHTML = "";
  
  if (m.type === "Item") {
    if (m.itemType) {
      itemTypeHTML = `<div style="font-size:16px; color:${m.itemTypeColor || "#E5E6E8"}; margin:2px 0;">${m.itemType}</div>`;
    }
    if (m.rarity) {
      rarityHTML = `<div style="font-size:16px; color:${m.rarityColor || "#E5E6E8"}; margin:2px 0;">${formatRarity(m.rarity)}</div>`;
    }
    if (m.description) {
      descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
    }
    if (m.extraLines && m.extraLines.length) {
      m.extraLines.forEach(line => {
        extraHTML += `<p style="margin-top:5px; margin-bottom:0; color:${line.color || "#E5E6E8"};">${line.text}</p>`;
      });
    }
  } else {
    if (m.description) {
      descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
    }
  }
  
  const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor || "#E5E6E8"};">${m.name}</h3>`;
  const scaledImg = m.imageBig
    ? `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;" />`
    : "";
  let videoBtn = "";
  if (m.videoURL) {
    videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
  }
  
  return `
    <div class="custom-popup">
      <div class="popup-header" style="display:flex; gap:5px;">
        ${scaledImg}
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
    </div>
  `;
}
