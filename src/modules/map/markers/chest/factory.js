/* @file: src/modules/map/markers/chest/factory.js */
/* @version: 1.0 — factory for creating chest markers */

import createMarker from "../common/createMarker.js";
import createCustomIcon from "../common/createCustomIcon.js";
import renderChestPopup from "./popup.js";

/**
 * Create a Leaflet marker for a chest definition.
 *
 * @param {Object} def – Chest definition from Firestore
 * @param {[number, number]} def.coords – [lat, lng] coordinates
 * @param {string} def.imageSmall – URL for the small icon
 * @param {string} def.category – Chest category (“Normal” | “Dragonvault”)
 * @param {string} def.size – Chest size (“Small” | “Medium” | “Large”)
 * @returns {L.Marker}
 */
export default function createChestMarker(def) {
  // Build a classname based on category & size, e.g. "marker-icon-chest-normal-small"
  const className = `marker-icon-chest-${def.category.toLowerCase()}-${def.size.toLowerCase()}`;

  // Use the small image as the icon URL
  const icon = createCustomIcon(def.imageSmall, { className });

  // Create the marker at the given coordinates
  const marker = createMarker(def.coords, { icon });

  // Bind the chest popup content
  marker.bindPopup(renderChestPopup(def));

  return marker;
}
