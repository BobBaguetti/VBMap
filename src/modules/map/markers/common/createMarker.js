/* @file: src/modules/map/markers/common/createMarker.js */
/* @version: 1.0 — migrated and refactored from src/modules/map/marker/icons/createMarker.js */

const L = window.L;

/**
 * Creates a Leaflet marker at the given coordinates with provided options.
 *
 * @param {[number, number]} coords – [latitude, longitude]
 * @param {Object} options – Leaflet marker options (e.g., { icon, draggable })
 * @returns {L.Marker}
 */
export default function createMarker(coords, options = {}) {
  const [lat, lng] = coords;
  return L.marker([lat, lng], options);
}
