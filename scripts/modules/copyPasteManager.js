// scripts/modules/copyPasteManager.js
// Clipboard copy‑/paste manager with a ghost preview marker.

import { createCustomIcon } from "./markerManager.js";

/**
 * Sets up copy‑paste behaviour on the given Leaflet map.
 * @param {L.Map}      map               Leaflet map instance
 * @param {Function}   addMarkerCallback Function(newMarkerData) – must add the
 *                                       marker to the map *and* persist it.
 * @returns {{ startCopy:Function, cancel:Function }}
 */
export function initCopyPasteManager(map, addMarkerCallback) {
  let pasteMode   = false;
  let copiedData  = null;      // JSON‑safe marker *without* id
  let ghostMarker = null;      // L.Marker following the cursor

  /** Remove ghost + reset state */
  function cancel() {
    if (ghostMarker) {
      map.removeLayer(ghostMarker);
      ghostMarker = null;
    }
    pasteMode  = false;
    copiedData = null;
    map.getContainer().style.cursor = "";
  }

  /** Begin copy workflow */
  function startCopy(markerData) {
    copiedData = JSON.parse(JSON.stringify(markerData));
    delete copiedData.id;                       // new marker will get its own id
    pasteMode  = true;
    map.getContainer().style.cursor = "copy";   // visual hint

    // Create ghost marker (semi‑transparent)
    if (ghostMarker) map.removeLayer(ghostMarker);
    ghostMarker = L.marker(map.getCenter(), {
      icon: createCustomIcon(copiedData),
      interactive: false,
      opacity: 0.5
    }).addTo(map);
  }

  /* ----------  Event bindings  ---------- */
  map.on("mousemove", (e) => {
    if (pasteMode && ghostMarker) ghostMarker.setLatLng(e.latlng);
  });

  map.on("click", (e) => {
    if (!pasteMode || !copiedData) return;
    const newData = JSON.parse(JSON.stringify(copiedData));
    newData.coords = [e.latlng.lat, e.latlng.lng];
    newData.name  += " (copy)";
    addMarkerCallback(newData);                 // caller handles Firestore save
    cancel();
  });

  // Right‑click anywhere on the document cancels paste mode
  document.addEventListener("contextmenu", cancel);

  return { startCopy, cancel };
}
