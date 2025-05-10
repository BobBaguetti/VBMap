// @file: src/modules/sidebar/filters/sidebarFilters.js
// @version: 1.4 — accept `layers` and use layers.Item / layers.Chest

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

/**
 * Wires up static main‐filters & item‐filter-list, and returns filtering functions.
 *
 * @param {Array<{ markerObj: L.Marker, data: object }>} allMarkers
 * @param {firebase.firestore.Firestore} db
 * @param {{ Item: L.LayerGroup, Chest: L.LayerGroup }} layers
 * @returns {Promise<{ filterMarkers: Function, loadItemFilters: Function }>}
 */
export async function renderSidebarFilters(allMarkers, db, layers) {
  const mainGroup = document.getElementById("main-filters");
  const itemList  = document.getElementById("item-filter-list");
  const searchBar = document.getElementById("search-bar");

  if (!mainGroup || !itemList) {
    console.error("[sidebar] missing #main-filters or #item-filter-list");
    return {};
  }

  // Core filtering logic now uses passed-in layers
  function filterMarkers() {
    const nameQ = (searchBar.value || "").toLowerCase();
    const pveOn = document.getElementById("toggle-pve")?.checked ?? true;

    const itemToggle  = mainGroup.querySelector('input[data-layer="Item"]');
    const chestToggle = mainGroup.querySelector('input[data-layer="Chest"]');

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesName = data.name?.toLowerCase().includes(nameQ);
      const matchesPvE  = pveOn || data.type !== "Item";

      let mainVisible = true;
      if (data.type === "Item" && itemToggle && !itemToggle.checked) mainVisible = false;
      if (data.type === "Chest" && chestToggle && !chestToggle.checked) mainVisible = false;

      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = itemList.querySelector(`input[data-item-id="${data.predefinedItemId}"]`);
        if (cb && !cb.checked) itemVisible = false;
      }

      const show = matchesName && matchesPvE && mainVisible && itemVisible;
      if (show) {
        layers[data.type]?.addLayer(markerObj);
      } else {
        layers[data.type]?.removeLayer(markerObj);
      }
    });
  }

  // Wire up main toggles & search
  mainGroup.querySelectorAll('input[data-layer], #toggle-pve').forEach(el =>
    el.addEventListener("change", filterMarkers)
  );
  if (searchBar) searchBar.addEventListener("input", filterMarkers);

  // Populate item filters
  async function loadItemFilters() {
    itemList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    const ids = [];
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" checked data-item-id="${d.id}"><span>${d.name}</span>`;
      const cb = label.querySelector("input");
      cb.addEventListener("change", filterMarkers);
      itemList.appendChild(label);
      ids.push(d.id);
    });
    filterMarkers();
    return ids;
  }

  // Initial population & filtering
  const initialIds = await loadItemFilters();
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
