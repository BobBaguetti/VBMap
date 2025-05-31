// @file: src/bootstrap/settingsController.js
// @version: 1.0 — standalone “Small Markers” & “Marker Grouping” logic

import markerLoader, { setGrouping } from "./markerLoader.js";

/**
 * Wires up the “Enable Marker Grouping” and “Small Markers (50%)” checkboxes.
 *
 * @param {L.Map} map
 * @param {L.LayerGroup} clusterItemLayer
 * @param {L.LayerGroup} flatItemLayer
 * @param {Function} filterMarkers
 */
export function initSettingsToggles(map, clusterItemLayer, flatItemLayer, filterMarkers) {
  // We assume the Settings modal (settingsModal.js) has already injected these checkboxes:
  //   <input type="checkbox" id="toggle-grouping" />
  //   <input type="checkbox" id="toggle-small-markers" />
  //
  // and we also assume there is a <div id="map"> created by initializeMap().

  // Delay by one tick, so that the DOM has time to append the modal’s HTML.
  setTimeout(() => {
    const groupingCheckbox = document.getElementById("toggle-grouping");
    const smallCheckbox    = document.getElementById("toggle-small-markers");
    const mapEl            = document.getElementById("map");

    if (!groupingCheckbox || !smallCheckbox || !mapEl) {
      console.warn("[settingsController] Could not find settings toggles or #map");
      return;
    }

    // ── “Enable Marker Grouping” toggle ─────────────────────────────────
    groupingCheckbox.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      setGrouping(enabled);

      if (enabled) {
        // Move existing markers from flat → cluster
        markerLoader.allMarkers.forEach(({ markerObj }) => {
          flatItemLayer.removeLayer(markerObj);
          clusterItemLayer.addLayer(markerObj);
        });

        if (map.hasLayer(flatItemLayer)) {
          map.removeLayer(flatItemLayer);
        }
        if (!map.hasLayer(clusterItemLayer)) {
          map.addLayer(clusterItemLayer);
        }
      } else {
        // Move existing markers from cluster → flat
        markerLoader.allMarkers.forEach(({ markerObj }) => {
          clusterItemLayer.removeLayer(markerObj);
          flatItemLayer.addLayer(markerObj);
        });

        if (map.hasLayer(clusterItemLayer)) {
          map.removeLayer(clusterItemLayer);
        }
        if (!map.hasLayer(flatItemLayer)) {
          map.addLayer(flatItemLayer);
        }
      }

      // Re‐apply filters so newly‐moved markers obey the current filter state
      filterMarkers();
    });

    // ── “Small Markers (50%)” toggle ────────────────────────────────────
    smallCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        mapEl.classList.add("small-markers");
      } else {
        mapEl.classList.remove("small-markers");
      }
    });
  }, 0);
}
