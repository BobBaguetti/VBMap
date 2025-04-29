// @file:    /scripts/modules/map/markerManager.js
// @version: 10.1 – chest-slot borders now use rarityColors (same as item markers)

import { formatRarity }     from "../utils/utils.js";
import { createIcon }       from "../utils/iconUtils.js";
import { defaultNameColor, rarityColors } from "../utils/colorPresets.js";

/*────────────────────────── Shared helpers ──────────────────────────*/
function isImgUrl(str) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(str || "");
}
function getBestImageUrl(m, ...keys) {
  for (const k of keys) {
    const url = m[k];
    if (url && isImgUrl(url)) return url;
  }
  return "";
}

/*───────────────────────── Item / NPC popup ─────────────────────────*/
export function renderPopup(m) {
  const imgUrl = getBestImageUrl(m, "imageBig", "imageLarge", "imageSmall");
  const bigImg = imgUrl
    ? `<img src="${imgUrl}" class="popup-image"
             style="border-color:${m.rarityColor || defaultNameColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `
    <div class="popup-name" style="color:${m.nameColor || defaultNameColor};">
      ${m.name || "Unnamed"}
    </div>`;

  const typeHTML = m.itemType
    ? `<div class="popup-type" style="color:${m.itemTypeColor || defaultNameColor};">
         ${m.itemType}
       </div>`
    : "";

  const rarityHTML = m.rarity
    ? `<div class="popup-rarity" style="color:${m.rarityColor || defaultNameColor};">
         ${formatRarity(m.rarity)}
       </div>`
    : "";

  const valueHTML = m.value
    ? `<div class="popup-value-icon" title="Value">
         <span class="popup-value-number">${m.value}</span>
         ${createIcon("coins", { inline: true }).outerHTML}
       </div>`
    : "";

  const descHTML = m.description
    ? `<p class="popup-desc" style="color:${m.descriptionColor || defaultNameColor};">
         ${m.description}
       </p>`
    : "";

  const extraHTML = (m.extraLines || [])
    .map(
      (line) => `
      <p class="popup-extra-line" style="color:${line.color || defaultNameColor};">
        ${line.text}
      </p>`
    )
    .join("");

  const quantityHTML = m.quantity > 1 ? `<p class="popup-meta">Quantity: ${m.quantity}</p>` : "";

  const closeBtn = `
    <span class="popup-close-btn"
          style="position:absolute;top:8px;right:8px;cursor:pointer;padding:4px;">
      ${createIcon("x", { inline: true }).outerHTML}
    </span>`;

  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
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

/*──────────────────────────── Chest popup ───────────────────────────*/
export function renderChestPopup(typeDef) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // ─── Header (icon + title) ────────────────────────────────────────
  const bigImg     = typeDef.iconUrl
    ? `<img src="${typeDef.iconUrl}" class="popup-image" onerror="this.style.display='none'">`
    : "";
  const nameHTML   = `<div class="popup-name">${typeDef.name}</div>`;
  const subtextHTML= typeDef.subtext
    ? `<div class="popup-type">${typeDef.subtext}</div>`
    : "";

  // ─── Loot grid panel ──────────────────────────────────────────────
  const COLS = 4;
  const pool = typeDef.lootPool || [];
  let   cells = "";

  for (let i = 0; i < COLS; i++) {
    const it = pool[i];
    if (!it) {
      cells += `<div class="chest-slot"></div>`;
      continue;
    }
    const clr = it.rarityColor
              || rarityColors[(it.rarity||"").toLowerCase()]
              || defaultNameColor;

    cells += `<div class="chest-slot" style="border-color:${clr}" title="${it.name||""}">
                <img src="${it.imageSmall||""}" class="chest-slot-img">
                ${it.quantity>1 ? `<span class="chest-slot-qty">${it.quantity}</span>` : ""}
              </div>`;
  }

  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // ─── Description & extras panel ──────────────────────────────────
  const descHTML  = typeDef.description
    ? `<p class="popup-desc">${typeDef.description}</p>`
    : "";
  const extraHTML = (typeDef.extraLines||[])
    .map(l => `<p class="popup-extra-line">${l.text}</p>`)
    .join("");
  const textBox   = descHTML||extraHTML
    ? `<div class="popup-info-box">${descHTML}${extraHTML}</div>`
    : "";

  // ─── Assemble final popup HTML ───────────────────────────────────
  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">${nameHTML}${subtextHTML}</div>
        </div>
      </div>
      ${lootBox}
      ${textBox}
    </div>`;
}

/*──────────────────────── Marker icon factory ───────────────────────*/
export function createCustomIcon(m) {
  const imgUrl = getBestImageUrl(m, "imageSmall", "imageBig", "imageLarge");
  const size = 32;

  const wrap = document.createElement("div");
  wrap.className = "custom-marker";
  Object.assign(wrap.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    overflow: "hidden",
    position: "relative",
  });

  const border = document.createElement("div");
  border.className = "marker-border";
  Object.assign(border.style, {
    position: "absolute",
    inset: 0,
    boxSizing: "border-box",
    border: `2px solid ${m.rarityColor || defaultNameColor}`,
  });
  wrap.appendChild(border);

  if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    });
    img.onerror = () => {
      img.style.display = "none";
    };
    wrap.appendChild(img);
  }

  return L.divIcon({
    html: wrap.outerHTML,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/*──────────────────────────── Marker factory ────────────────────────*/
export function createMarker(m, map, layers, ctxMenu, callbacks = {}, isAdmin = false) {
  const markerObj = L.marker(m.coords, { icon: createCustomIcon(m), draggable: false });

  /* choose popup html */
  const html = m.type === "Chest" && m.chestDefFull ? renderChestPopup(m.chestDefFull) : renderPopup(m);

  markerObj.bindPopup(html, {
    className: "custom-popup-wrapper",
    maxWidth: 350,
    closeButton: false,
    offset: [0, -35],
  });

  markerObj.on("popupopen", () => {
    document.querySelector(".custom-popup .popup-close-btn")?.addEventListener("click", () => markerObj.closePopup());
  });

  layers[m.type]?.addLayer(markerObj);

  markerObj.on("contextmenu", (ev) => {
    ev.originalEvent.preventDefault();
    const opts = [];
    if (isAdmin) {
      opts.push(
        { text: "Edit Marker", action: () => callbacks.onEdit?.(markerObj, m, ev.originalEvent) },
        { text: "Copy Marker", action: () => callbacks.onCopy?.(markerObj, m, ev.originalEvent) },
        {
          text: markerObj.dragging?.enabled() ? "Disable Drag" : "Enable Drag",
          action: () => {
            if (markerObj.dragging?.enabled()) {
              markerObj.dragging.disable();
            } else {
              markerObj.dragging.enable();
              markerObj.once("dragend", () => {
                const ll = markerObj.getLatLng();
                m.coords = [ll.lat, ll.lng];
                callbacks.onDragEnd?.(markerObj, m);
              });
            }
          },
        },
        { text: "Delete Marker", action: () => callbacks.onDelete?.(markerObj, m) }
      );
    }
    ctxMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });

  return markerObj;
}
