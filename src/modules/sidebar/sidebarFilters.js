// @file: src/modules/sidebar/sidebarFilters.js
// @version: 1.0 — core filter logic wiring for sidebar

/**
 * Create and wire up filter logic for markers.
 *
 * @param {Array<{markerObj: L.Marker, data: object}>} allMarkers
 * @param {{ [type: string]: L.LayerGroup }} layers
 * @param {HTMLInputElement} searchBar — the input element for name search
 * @returns {() => void} filterMarkers — call to re-evaluate visibility
 */
export function createFilterLogic(allMarkers, layers, searchBar) {
  // Main filter checkboxes under #main-filters .toggle-group
  const mainFilterCbs = Array.from(
    document.querySelectorAll("#main-filters .toggle-group input")
  );

  // PvE toggle
  const pveToggle = document.getElementById("toggle-pve");

  // Chest toggle appended in sidebarCore
  const chestCb = document.querySelector(
    "#main-filters .toggle-group input[data-layer='Chest']"
  );

  // Wire search input
  searchBar.addEventListener("input", filterMarkers);

  // Wire main filters
  mainFilterCbs.forEach(cb => cb.addEventListener("change", filterMarkers));

  // Wire PvE toggle (if exists)
  if (pveToggle) pveToggle.addEventListener("change", filterMarkers);

  // Wire chest toggle
  if (chestCb) chestCb.addEventListener("change", filterMarkers);

  /**
   * Hides or shows markers based on current filter settings.
   */
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main type toggles (Item/Chest)
      const mainMatch = mainFilterCbs.every(cb => {
        return cb.dataset.layer !== data.type || cb.checked;
      });

      // Combined visibility
      const shouldShow = matchesPvE && matchesName && mainMatch;
      const layerGroup = layers[data.type];
      if (!layerGroup) return;

      if (shouldShow) {
        layerGroup.addLayer(markerObj);
      } else {
        layerGroup.removeLayer(markerObj);
      }
    });
  }

  return filterMarkers;
}
