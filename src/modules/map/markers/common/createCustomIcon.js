/* @file: src/modules/map/markers/common/createCustomIcon.js */
/* @version: 1.0 — migrated and refactored from src/modules/map/marker/icons/createCustomIcon.js */

import { defaultNameColor } from "../../../utils/colorPresets.js";
import { getBestImageUrl } from "../utils.js";
const L = window.L;

/**
 * Creates a circular Leaflet divIcon for a marker,
 * using the provided image URL (if available) and a colored border.
 *
 * @param {Object} def – marker definition object
 * @param {string} def.imageSmall – URL for the small icon
 * @param {string} [def.imageLarge] – fallback large icon URL
 * @param {string} [def.rarityColor] – border color
 * @param {Object} [options] – additional options (e.g., className)
 * @param {string} [options.className] – extra CSS class for the icon
 * @returns {L.DivIcon}
 */
export default function createCustomIcon(def, { className = "" } = {}) {
  const imgUrl = getBestImageUrl(def, "imageSmall", "imageLarge");
  const size   = 32;
  const borderColor = def.rarityColor || defaultNameColor;

  // Build the HTML structure for the icon
  const html = `
    <div class="custom-marker ${className}" style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      overflow: hidden;
    ">
      <div class="marker-border" style="
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        border: 2px solid ${borderColor};
        border-radius: 50%;
      "></div>
      ${
        imgUrl
          ? `<img src="${imgUrl}" style="
               width: 100%;
               height: 100%;
               object-fit: cover;
               display: block;
             " onerror="this.style.display='none'"/>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
