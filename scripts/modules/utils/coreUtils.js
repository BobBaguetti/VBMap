// @file: /scripts/modules/utils/coreUtils.js
// @version: 1

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Formats a rarity string (lowercases then capitalizes).
   */
  export function formatRarity(rarity) {
    if (!rarity) return "";
    return capitalize(rarity.toLowerCase());
  }
  
  /**
   * Logs at various levels.
   */
  export function log(message, level = "info") {
    switch(level) {
      case "warn":  console.warn(message); break;
      case "error": console.error(message); break;
      default:      console.log(message);
    }
  }
  
  /**
   * Deep-clones JSON-safe objects.
   */
  export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  