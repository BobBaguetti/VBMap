// @file: src/modules/map/markers/npc/factory.js
// @version: 1.0 — create NPC marker factory

import createCustomIcon from "../common/createCustomIcon.js";
import createMarker     from "../common/createMarker.js";
import renderNPCPopup   from "./popup.js";

/**
 * Given an NPC definition `def`, produce a Leaflet marker
 * with the correct icon and popup attached.
 *
 * @param {Object} def – NPC definition (including coords, iconSmall, isHostile, etc.)
 * @returns {L.Marker}
 */
export default function createNPCMarker(def) {
  const icon = createCustomIcon(def.iconSmall, {
    className: def.isHostile
      ? "marker-icon-npc-hostile"
      : "marker-icon-npc-friendly"
  });
  const marker = createMarker(def.coords, { icon });
  marker.bindPopup(renderNPCPopup(def));
  return marker;
}
