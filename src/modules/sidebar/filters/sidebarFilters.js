// @file: src/modules/sidebar/filters/sidebarFilters.js
// @version: 1.1 — use modular main and item filters, fix import paths

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { renderMainFilters }   from "./mainFilters.js";
import { renderItemFilters }   from "./itemFilters.js";

/**
 * Renders the Filters section in the sidebar and wires up filtering logic.
 *
 * @param {HTMLElement} filtersContainer — the <div> where filters belong
 * @param {Array<{ markerObj: L.Marker, data: object }>} allMarkers
 * @param {firebase.firestore.Firestore} db
 * @returns {Promise<{ filterMarkers: Function, loadItemFilters: Function }>}
 */
export async function renderSidebarFilters(filtersContainer, allMarkers, db) {
  // Clear any existing filters
  filtersContainer.innerHTML = "";

  // 1) Render main filters into the container
  //    Gets us elements.itemToggle, chestToggle, pveToggle, searchBar wired to call filterMarkers
  const { elements } = renderMainFilters(filtersContainer, () => filterMarkers());

  // 2) Render item‐specific filters into the same container
  await renderItemFilters(filtersContainer, () => filterMarkers(), db);

  // 3) Core filtering logic
  const { itemToggle, chestToggle, pveToggle, searchBar } = elements;

  function filterMarkers() {
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      // Name & PvE matching
      const matchesName = data.name?.toLowerCase().includes(nameQuery);
      const matchesPvE  = pveOn || data.type !== "Item";

      // Main group (Item vs Chest)
      let mainVisible = true;
      if (data.type === "Item" && !itemToggle.checked)   mainVisible = false;
      if (data.type === "Chest" && !chestToggle.checked) mainVisible = false;

      // Per‐item filter (if this marker has a predefinedItemId)
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = filtersContainer.querySelector(
          `input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      const shouldShow = matchesName && matchesPvE && mainVisible && itemVisible;
      if (shouldShow) {
        markerObj.addTo(data.type === "Item" 
          ? filtersContainer._layers.item 
          : filtersContainer._layers.Chest
        );
      } else {
        markerObj.remove();
      }
    });
  }

  // Initial filter run
  filterMarkers();

  // Expose filterMarkers and a loader for item‐filter IDs
  return {
    filterMarkers,
    loadItemFilters: async () => {
      const defs = await loadItemDefinitions(db);
      return defs.filter(d => d.showInFilters).map(d => d.id);
    }
  };
}
