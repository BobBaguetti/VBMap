/* @file: src/modules/map/markers/item/factory.js */
/* @version: 1.0 — factory for creating item markers */

import createMarker from "../common/createMarker.js";
import createCustomIcon from "../common/createCustomIcon.js";
import renderItemPopup from "./popup.js";

/**
 * Create a Leaflet marker for an item definition.
 *
 * @param {Object} def – Item definition from Firestore
 * @param {[number, number]} def.coords – [lat, lng] coordinates
 * @param {string} def.imageSmall – URL for the small icon
 * @returns {L.Marker}
 */
export default function createItemMarker(def) {
  // Use the small image as the icon URL
  const icon = createCustomIcon(def.imageSmall, {
    className: "marker-icon-item"
  });

  // Create the marker at the given coordinates
  const marker = createMarker(def.coords, { icon });

  // Bind the item popup content
  marker.bindPopup(renderItemPopup(def));

  return marker;
}
