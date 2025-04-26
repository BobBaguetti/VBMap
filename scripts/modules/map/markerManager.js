// @file: /scripts/modules/map/markerManager.js
// @version: 9.1

import { formatRarity }    from "../utils/utils.js";
import { createIcon }      from "../utils/iconUtils.js";
import { defaultNameColor } from "../../utils/colorPresets.js";

/**
 * Checks whether a string is a valid image URL.
 */
function isImgUrl(str) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(str || "");
}

/**
 * Returns the first valid image URL from the given candidate properties.
 */
function getBestImageUrl(m, ...keys) {
  for (const key of keys) {
    const url = m[key];
    if (url && isImgUrl(url)) return url;
  }
  return "";
}

/**
 * Renders the HTML for a marker popup.
 */
export function renderPopup(m) {
  const imgUrl = getBestImageUrl(m, "imageBig", "imageLarge", "imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${m.rarityColor||defaultNameColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `
    <div class="popup-name" style="color:${m.nameColor||defaultNameColor};">
      ${m.name || "Unnamed Item"}
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

  const quantityHTML = m.quantity > 1
    ? `<p class="popup-meta">Quantity: ${m.quantity}</p>`
    : "";

  const closeBtnHTML = `
    <span class="popup-close-btn" style="
         position:absolute; top:8px; right:8px;
         cursor:pointer; padding:4px;">
      ${createIcon("x",{inline:true}).outerHTML}
    </span>`;

  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtnHTML}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}
            ${typeHTML}
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

/**
 * Creates a circular Leaflet icon for the marker.
 */
export function createCustomIcon(m) {
  const imgUrl = getBestImageUrl(m, "imageSmall","imageBig","imageLarge");
  const size   = 32;

  const wrapper = document.createElement("div");
  wrapper.className = 'custom-marker';
  Object.assign(wrapper.style, {
    width:       `${size}px`,
    height:      `${size}px`,
    borderRadius:'50%',
    overflow:    'hidden',
    position:    'relative'
  });

  const border = document.createElement("div");
  border.className = 'marker-border';
  Object.assign(border.style, {
    position:   'absolute',
    top:        0,
    left:       0,
    width:      '100%',
    height:     '100%',
    boxSizing:  'border-box',
    border:     `2px solid ${m.rarityColor||defaultNameColor}`
  });
  wrapper.appendChild(border);

  if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    Object.assign(img.style, {
      width:       '100%',
      height:      '100%',
      objectFit:   'cover',
      display:     'block'
    });
    img.onerror = () => { img.style.display = 'none'; };
    wrapper.appendChild(img);
  }

  return L.divIcon({
    html:       wrapper.outerHTML,
    className:  '',
    iconSize:   [size, size],
    iconAnchor: [size/2, size/2]
  });
}

/**
 * Creates and returns a Leaflet marker with popup + context menu.
 */
export function createMarker(
  m, map, layers, ctxMenu, callbacks={}, isAdmin=false
) {
  const markerObj = L.marker(m.coords, {
    icon:      createCustomIcon(m),
    draggable: false
  });

  markerObj.bindPopup(renderPopup(m), {
    className:    'custom-popup-wrapper',
    maxWidth:     350,
    closeButton:  false,
    offset:       [0, -35]
  });

  markerObj.on('popupopen', () => {
    const popupEl  = document.querySelector('.custom-popup');
    const closeBtn = popupEl?.querySelector('.popup-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => markerObj.closePopup());
  });

  layers[m.type]?.addLayer(markerObj);

  markerObj.on('contextmenu', evt => {
    evt.originalEvent.preventDefault();
    const opts = [];

    if (isAdmin) {
      opts.push(
        { text:'Edit Marker', action: ()=>callbacks.onEdit?.(markerObj,m,evt.originalEvent) },
        { text:'Copy Marker', action: ()=>callbacks.onCopy?.(markerObj,m,evt.originalEvent) },
        {
          text: markerObj.dragging?.enabled()
            ? 'Disable Drag' : 'Enable Drag',
          action: () => {
            if (markerObj.dragging?.enabled()) {
              markerObj.dragging.disable();
            } else {
              markerObj.dragging.enable();
              markerObj.once('dragend', () => {
                const ll = markerObj.getLatLng();
                m.coords = [ll.lat, ll.lng];
                callbacks.onDragEnd?.(markerObj,m);
              });
            }
          }
        },
        { text:'Delete Marker', action: ()=>callbacks.onDelete?.(markerObj,m) }
      );
    }

    ctxMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, opts);
  });

  return markerObj;
}
