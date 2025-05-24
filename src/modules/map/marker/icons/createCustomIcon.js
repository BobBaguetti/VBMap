/* @file: src/modules/map/marker/icons/createCustomIcon.js */
/* @version: 1.5 — add drop-shadow to marker wrapper */

const L = window.L;

import { defaultNameColor }    from "../../../../shared/utils/color/colorPresets.js";
import { getBestImageUrl }     from "../utils.js";
import { CHEST_RARITY, rarityColors } from "../../markerManager.js";

/**
 * Creates a Leaflet divIcon for a marker,
 * using the item's image (if available) and a colored border.
 *
 * @param {object} m — marker definition object
 * @returns {L.DivIcon}
 */
export function createCustomIcon(m) {
  const imgUrl = getBestImageUrl(m, "imageSmall", "imageBig", "imageLarge");
  const size   = 32;

  // Determine border color: chest logic first, then item rarity/NPC disposition
  let borderColor = defaultNameColor;

  if (m.type === "Chest") {
    // Chest: derive color from category & size
    const catMap = CHEST_RARITY[m.category] || {};
    const key    = catMap[m.size]    || "common";
    borderColor  = rarityColors[key] || defaultNameColor;
  } else if (m.rarityColor) {
    // Item or NPC: use its rarityColor
    borderColor = m.rarityColor;
  }

  // wrapper div to hold image and border
  const wrap = document.createElement("div");
  wrap.className = "custom-marker";
  Object.assign(wrap.style, {
    position:     "relative",
    width:        `${size}px`,
    height:       `${size}px`,
    borderRadius: "50%",
    overflow:     "hidden",
    boxShadow:    "0 2px 6px rgba(0,0,0,0.3)"
  });

  // colored border
  const border = document.createElement("div");
  border.className = "marker-border";
  Object.assign(border.style, {
    position:     "absolute",
    inset:         0,
    boxSizing:    "border-box",
    border:        `2px solid ${borderColor}`,
    borderRadius: "50%"
  });
  wrap.appendChild(border);

  // optional image
  if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    Object.assign(img.style, {
      width:     "100%",
      height:    "100%",
      objectFit: "cover",
      display:   "block"
    });
    img.onerror = () => { img.style.display = "none"; };
    wrap.appendChild(img);
  }

  return L.divIcon({
    html:        wrap.outerHTML,
    className:   "",
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2]
  });
}
