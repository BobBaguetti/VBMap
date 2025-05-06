// @file:    /scripts/modules/map/markerManager.js
// @version: 10.12 – fix drag toggle to not write; only dragend invokes callback

import { formatRarity }     from "../utils/coreUtils.js";
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

/**
 * Map chest category + size → rarity key
 * (small/medium normal = common; large normal = uncommon;
 *  small DV = rare; medium DV = epic; large DV = legendary)
 */
const CHEST_RARITY = {
  Normal: {
    Small:  "common",
    Medium: "common",
    Large:  "uncommon"
  },
  Dragonvault: {
    Small:  "rare",
    Medium: "epic",
    Large:  "legendary"
  }
};

/*───────────────────────── Item / NPC popup ─────────────────────────*/
export function renderPopup(m) {
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

  const quantityHTML = m.quantity>1
    ? `<p class="popup-meta">Quantity: ${m.quantity}</p>`
    : "";

  const closeBtn = `
    <span class="popup-close-btn" style="position:absolute;top:8px;right:8px;cursor:pointer;padding:4px;">
      ${createIcon("x",{inline:true}).outerHTML}
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

  // 1) Compute chest rarity from category & size
  const cat  = typeDef.category || "Normal";
  const size = typeDef.size     || "Small";
  const key  = CHEST_RARITY[cat]?.[size] || "common";
  const rarityLabel = formatRarity(key);
  const rarityColor = rarityColors[key] || defaultNameColor;

  // 2) Header (icon + Name, Category, Rarity)
  const bigImg = typeDef.iconUrl
    ? `<img src="${typeDef.iconUrl}" class="popup-image"
             style="border-color:${rarityColor}"
             onerror="this.style.display='none'">`
    : "";

  const nameHTML = `
    <div class="popup-name" style="color:${rarityColor};">
      ${typeDef.name}
    </div>`;
  const typeHTML = `<div class="popup-type">${cat}</div>`;
  const rarityHTML = `
    <div class="popup-rarity" style="color:${rarityColor};">
      ${rarityLabel}
    </div>`;

  // 3) Loot grid (5 columns, fill first row to always show 5)
  const COLS = 5;
  const pool = typeDef.lootPool || [];
  let cells = "";

  pool.forEach((it, idx) => {
    const clr = it.rarityColor
      || rarityColors[(it.rarity||"").toLowerCase()]
      || defaultNameColor;
    cells += `
      <div class="chest-slot" data-index="${idx}"
           style="border-color:${clr}">
        <img src="${it.imageSmall||""}" class="chest-slot-img">
        ${it.quantity>1?`<span class="chest-slot-qty">${it.quantity}</span>`:""}
      </div>`;
  });
  if (pool.length < COLS) {
    for (let i = pool.length; i < COLS; i++) {
      cells += `<div class="chest-slot" data-index=""></div>`;
    }
  }

  const lootBox = `
    <div class="popup-info-box loot-box">
      <div class="chest-grid" style="--cols:${COLS};">
        ${cells}
      </div>
    </div>`;

  // 4) Description & extra-info (with user-picked colors + divider)
  const descHTML = typeDef.description
    ? `<p class="popup-desc" style="color:${typeDef.descriptionColor||defaultNameColor};">
         ${typeDef.description}
       </p>`
    : "";
  const extraHTML = (typeDef.extraLines||[])
    .map(l => `
      <p class="popup-extra-line" style="color:${l.color||defaultNameColor};">
        ${l.text}
      </p>`)
    .join("");
  const textBox = (descHTML||extraHTML)
    ? `<div class="popup-info-box">
         ${descHTML}
         ${descHTML&&extraHTML?'<hr class="popup-divider">':''}
         ${extraHTML}
       </div>`
    : "";

  // 5) Assemble final HTML
  return `
    <div class="custom-popup" style="position:relative;">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          ${bigImg}
          <div class="popup-info">
            ${nameHTML}${typeHTML}${rarityHTML}
          </div>
        </div>
      </div>
      ${lootBox}
      ${textBox}
    </div>`;
}

/*──────────────────────── Marker icon factory ───────────────────────*/
export function createCustomIcon(m) {
  const imgUrl = getBestImageUrl(m, "imageSmall","imageBig","imageLarge");
  const size   = 32;

  const wrap = document.createElement("div");
  wrap.className = "custom-marker";
  Object.assign(wrap.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    overflow: "hidden",
    position: "relative"
  });

  const border = document.createElement("div");
  border.className = "marker-border";
  Object.assign(border.style, {
    position: "absolute",
    inset: 0,
    boxSizing: "border-box",
    border: `2px solid ${m.rarityColor||defaultNameColor}`
  });
  wrap.appendChild(border);

  if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    });
    img.onerror = () => { img.style.display = "none"; };
    wrap.appendChild(img);
  }

  return L.divIcon({
    html: wrap.outerHTML,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

/*──────────────────────────── Marker factory ────────────────────────*/
export function createMarker(m, map, layers, ctxMenu, callbacks={}, isAdmin=false) {
  // inject chest rarity into m for the marker border
  if (m.chestDefFull) {
    const cat  = m.chestDefFull.category||"Normal";
    const size = m.chestDefFull.size    ||"Small";
    const key  = CHEST_RARITY[cat]?.[size]||"common";
    m.rarity      = key;
    m.rarityColor = rarityColors[key];
  }

  // create marker, draggable off by default
  const markerObj = L.marker(m.coords, {
    icon: createCustomIcon(m),
    draggable: false
  });

  // on actual drag end, update data & invoke callback
  markerObj.on("dragend", ev => {
    const { lat, lng } = ev.target.getLatLng();
    m.coords = [lat, lng];
    callbacks.onDragEnd?.(markerObj, m);
  });

  // bind popup (rest of your code unchanged…)
  const html = (m.type === "Chest" && m.chestDefFull)
    ? renderChestPopup(m.chestDefFull)
    : renderPopup(m);

  markerObj.bindPopup(html, {
    className: "custom-popup-wrapper",
    maxWidth: 350,
    closeButton: false,
    offset: [0, -35]
  });

  markerObj.on("popupopen", () => {
    document.querySelector(".custom-popup .popup-close-btn")
      ?.addEventListener("click", () => markerObj.closePopup());
    document.querySelectorAll(".custom-popup .chest-slot[data-index]").forEach(el => {
      el.removeAttribute("title");
      const idx = el.getAttribute("data-index");
      el.addEventListener("mouseenter", e => {
        if (!idx) return;
        const item = m.chestDefFull.lootPool[idx];
        if (!item) return;
        const preview = document.createElement("div");
        preview.className = "chest-item-preview";
        preview.innerHTML = renderPopup(item);
        Object.assign(preview.style, {
          position: "absolute",
          zIndex:   "1102",
          left:     `${e.clientX + 8}px`,
          top:      `${e.clientY + 8}px`
        });
        document.body.append(preview);
        el._previewEl = preview;
      });
      el.addEventListener("mouseleave", () => {
        el._previewEl?.remove();
      });
    });
  });

  markerObj.on("popupclose", () => {
    document.querySelectorAll(".chest-item-preview").forEach(el => el.remove());
  });

  layers[m.type]?.addLayer(markerObj);

  markerObj.on("contextmenu", ev => {
    ev.originalEvent.preventDefault();
    const opts = [];
    if (isAdmin) {
      opts.push(
        { 
          text: "Edit Marker", 
          action: () => callbacks.onEdit?.(markerObj, m, ev.originalEvent) 
        },
        { 
          text: "Copy Marker", 
          action: () => callbacks.onCopy?.(markerObj, m, ev.originalEvent) 
        },
        { 
          // toggle only, no write
          text: markerObj.dragging.enabled() ? "Disable Drag" : "Enable Drag",
          action: () => {
            markerObj.dragging.enabled()
              ? markerObj.dragging.disable()
              : markerObj.dragging.enable();
          }
        },
        { 
          text: "Delete Marker", 
          action: () => callbacks.onDelete?.(markerObj, m) 
        }
      );
    }
    ctxMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });

  return markerObj;
}
