// @file: src/modules/sidebar/filters/sidebarFilters.js
// @version: 1.2 — restore loadItemFilters to re-render checkboxes + return IDs

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { renderMainFilters }   from "./mainFilters.js";
import { renderItemFilters }   from "./itemFilters.js";

export async function renderSidebarFilters(filtersContainer, allMarkers, db) {
  filtersContainer.innerHTML = "";

  // 1) Main toggles
  const { elements } = renderMainFilters(filtersContainer, () => filterMarkers());

  // 2) Item checkboxes (initial)
  let currentItemIds = await renderItemFilters(filtersContainer, () => filterMarkers(), db);

  // 3) Filtering logic
  const { itemToggle, chestToggle, pveToggle, searchBar } = elements;
  function filterMarkers() {
    const nameQ = (searchBar?.value || "").toLowerCase();
    const pveOn = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesName = data.name?.toLowerCase().includes(nameQ);
      const matchesPvE  = pveOn || data.type !== "Item";

      let mainVisible = true;
      if (data.type === "Item" && !itemToggle.checked)   mainVisible = false;
      if (data.type === "Chest" && !chestToggle.checked) mainVisible = false;

      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = filtersContainer.querySelector(
          `input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      const show = matchesName && matchesPvE && mainVisible && itemVisible;
      if (show) markerObj.addTo(layersFor(data.type)); else markerObj.remove();
    });
  }

  // initial run
  filterMarkers();

  // 4) loadItemFilters for external callers: re-render item checkboxes & return updated IDs
  async function loadItemFilters() {
    currentItemIds = await renderItemFilters(filtersContainer, () => filterMarkers(), db);
    filterMarkers();
    return currentItemIds;
  }

  return { filterMarkers, loadItemFilters };
}

// helper to pick the right layer
function layersFor(type) {
  // your existing logic: map type → L.LayerGroup
  return type === "Item" ? window.clusterItemLayer : window.clusterChestLayer;
}
