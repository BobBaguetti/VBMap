// @file: src/modules/map/marker/icons/createCustomIcon.js
// @version: 1.3 — import Leaflet as ES module instead of using window.L; enforce circular clipping

import L from "leaflet";  // use ES-module Leaflet import
import { defaultNameColor } from "../../../utils/colorPresets.js";
import { getBestImageUrl } from "../utils.js";

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

  // wrapper div to hold image and border
  const wrap = document.createElement("div");
  wrap.className = "custom-marker";
  Object.assign(wrap.style, {
    position:     "relative",
    width:        `${size}px`,
    height:       `${size}px`,
    borderRadius: "50%",    // ensure circular shape
    overflow:     "hidden"  // clip anything outside the circle
  });

  // colored border
  const border = document.createElement("div");
  border.className = "marker-border";
  Object.assign(border.style, {
    position:     "absolute",
    inset:         0,
    boxSizing:    "border-box",
    border:        `2px solid ${m.rarityColor || defaultNameColor}`,
    borderRadius: "50%"    // match the wrapper's circle
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
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
