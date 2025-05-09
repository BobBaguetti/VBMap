// @file: src/modules/map/marker/utils.js
// @version: 1.0 — shared constants & helpers for popups/icons

/**
 * Map of chest category & size → rarity key.
 */
export const CHEST_RARITY = {
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

/**
 * Simple URL check to see if a string points to a supported image.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isImgUrl(str) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(str || "");
}

/**
 * Given an object `m` and a list of potential URL keys,
 * return the first non-empty valid image URL.
 *
 * @param {object} m
 * @param {...string} keys
 * @returns {string|undefined}
 */
export function getBestImageUrl(m, ...keys) {
  for (const k of keys) {
    const url = m[k];
    if (url && isImgUrl(url)) return url;
  }
  // fallback to undefined if none match
}
