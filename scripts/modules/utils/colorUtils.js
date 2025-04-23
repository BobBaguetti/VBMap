// @version: 2
// @file: /scripts/modules/utils/colorUtils.js

import { rarityColors, itemTypeColors } from "./colorPresets.js";

/**
 * Applies color presets for rarity and item type onto the given item definition object.
 * This modifies the object in-place by assigning .rarityColor and .itemTypeColor.
 *
 * @param {Object} def – The item definition object to update.
 * @returns {Object} The same object with updated colors.
 */
export function applyColorPresets(def) {
  if (!def || typeof def !== "object") return def;

  if (def.rarity && rarityColors[def.rarity]) {
    def.rarityColor = rarityColors[def.rarity];
  }

  if (def.itemType && itemTypeColors[def.itemType]) {
    def.itemTypeColor = itemTypeColors[def.itemType];
  }

  return def;
}

/**
 * Safely retrieves the HEXA color from a Pickr instance.
 * Falls back to a default value if unavailable.
 *
 * @param {Object} pickr – Pickr instance
 * @param {string} [fallback="#E5E6E8"] – Fallback color
 * @returns {string} HEXA color string (e.g. "#abcdefcc")
 */
export function getPickrHexColor(pickr, fallback = "#E5E6E8") {
  try {
    return pickr?.getColor()?.toHEXA()?.toString() || fallback;
  } catch {
    return fallback;
  }
}
