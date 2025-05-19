// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    src\shared\utils\utils.js

/**
 * Capitalizes the first letter of the given string.
 * @param {string} str The input string.
 * @returns {string} The string with its first letter capitalized.
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a rarity value by converting it to lowercase and then capitalizing the first letter.
 * @param {string} rarity The rarity string.
 * @returns {string} The formatted rarity.
 */
export function formatRarity(rarity) {
  if (!rarity) return "";
  return capitalize(rarity.toLowerCase());
}

/**
 * Logs a message at the specified level.
 * @param {string} message The message to log.
 * @param {string} [level="info"] Log level: "info", "warn", or "error".
 */
export function log(message, level = "info") {
  switch(level) {
    case "warn":
      console.warn(message);
      break;
    case "error":
      console.error(message);
      break;
    default:
      console.log(message);
      break;
  }
}

/**
 * Creates a deep clone of an object (using JSON serialization).
 * Note: This only works for JSON-safe objects.
 * @param {any} obj The object to clone.
 * @returns {any} The cloned object.
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
  