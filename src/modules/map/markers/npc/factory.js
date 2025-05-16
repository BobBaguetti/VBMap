/* @file: src/modules/map/markers/npc/factory.js */
/* @version: 1.0 — factory for creating NPC markers */

import createMarker from "../common/createMarker.js";
import createCustomIcon from "../common/createCustomIcon.js";
import renderNPCPopup from "./popup.js";

/**
 * Create a Leaflet marker for an NPC definition.
 *
 * @param {Object} def – NPC definition from Firestore
 * @param {[number, number]} def.coords – [lat, lng] coordinates
 * @param {string} def.iconSmall – URL for the small icon
 * @param {boolean} def.isHostile – whether this NPC is hostile
 * @returns {L.Marker}
 */
export default function createNPCMarker(def) {
  // Choose a class for styling
  const className = def.isHostile
    ? "marker-icon-npc-hostile"
    : "marker-icon-npc-friendly";

  // Build icon
  const icon = createCustomIcon(def, { className });

  // Create marker
  const marker = createMarker(def.coords, { icon });

  // Bind popup
  marker.bindPopup(renderNPCPopup(def));

  return marker;
}
