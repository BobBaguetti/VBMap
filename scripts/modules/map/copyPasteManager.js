// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/copyPasteManager.js
// Clipboard copy‑/paste manager with a ghost preview marker that stays active
// until the user right‑clicks to cancel. Only free‑form markers (those not linked to a predefined item) have "(copy)" appended to their names.

import { createCustomIcon } from "./markerManager.js";

/**
 * Initialise copy‑paste behaviour.
 * @param {L.Map} map                               Leaflet map instance.
 * @param {(data:Object)=>void} addMarkerCallback   Function that adds *and*
 *                                                persists the new marker.
 * @returns {{ startCopy:Function, cancel:Function }}
 */
export function initCopyPasteManager(map, addMarkerCallback) {
  let pasteMode   = false;
  let copiedData  = null;   // deep‑cloned marker data (no id)
  let ghostMarker = null;   // semi‑transparent preview marker

  /** End paste mode and clean up */
  function cancel() {
    if (ghostMarker) {
      map.removeLayer(ghostMarker);
      ghostMarker = null;
    }
    pasteMode  = false;
    copiedData = null;
    map.getContainer().style.cursor = "";
  }

  /** Begin paste mode for the supplied marker */
  function startCopy(markerData) {
    copiedData = JSON.parse(JSON.stringify(markerData));
    delete copiedData.id;                      // new marker gets its own id
    pasteMode  = true;
    map.getContainer().style.cursor = "copy";

    // Create the ghost preview (50% opacity)
    if (ghostMarker) map.removeLayer(ghostMarker);
    ghostMarker = L.marker(map.getCenter(), {
      icon: createCustomIcon(copiedData),
      interactive: false,
      opacity: 0.5
    }).addTo(map);
  }

  /* -------------------------------------------------- *
   *  Map events
   * -------------------------------------------------- */
  map.on("mousemove", e => {
    if (pasteMode && ghostMarker) ghostMarker.setLatLng(e.latlng);
  });

  map.on("click", e => {
    if (!pasteMode || !copiedData) return;

    const newData = JSON.parse(JSON.stringify(copiedData));
    delete newData.id;
    newData.coords = [e.latlng.lat, e.latlng.lng];

    // Only add “(copy)” when the marker is *not* tied to a predefined item.
    if (!newData.predefinedItemId) newData.name = `${newData.name} (copy)`;

    addMarkerCallback(newData);   // caller saves + renders the marker
    // Stay in paste mode; ghost remains until user right‑clicks
  });

  // Any right‑click cancels paste mode
  document.addEventListener("contextmenu", cancel);

  return { startCopy, cancel };
}

// @version: 1