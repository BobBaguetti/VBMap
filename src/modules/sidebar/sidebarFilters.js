// @file: src/modules/sidebar/sidebarFilters.js
// @version: 1.0 — extract filtering logic and item‐filter loading

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";

/**
 * Sets up marker filtering (name search, PvE toggle, main and item filters).
 *
 * @param {object} params
 * @param {string} params.searchBarSelector       – selector for the name-search input
 * @param {string} params.mainFiltersSelector     – selector for main filter checkboxes container
 * @param {string} params.pveToggleSelector       – selector for the PvE toggle checkbox
 * @param {string} params.itemFilterListSelector  – selector for the item-specific filters container
 * @param {object<string,L.LayerGroup>} params.layers
 * @param {Array<{ markerObj: L.Marker, data: object }>} params.allMarkers
 * @param {firebase.firestore.Firestore} params.db
 *
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export function setupSidebarFilters({
  searchBarSelector       = "#search-bar",
  mainFiltersSelector     = "#main-filters .toggle-group",
  pveToggleSelector       = "#toggle-pve",
  itemFilterListSelector  = "#item-filter-list",
  layers,
  allMarkers,
  db
}) {
  const searchBar     = document.querySelector(searchBarSelector);
  const mainGroup     = document.querySelector(mainFiltersSelector);
  const pveToggle     = document.querySelector(pveToggleSelector);
  const itemFilterList = document.querySelector(itemFilterListSelector);

  // Add “Chests” toggle if not present
  if (mainGroup && !mainGroup.querySelector('input[data-layer="Chest"]')) {
    const chestLabel = document.createElement("label");
    chestLabel.innerHTML = `<input type="checkbox" checked data-layer="Chest"/><span>Chests</span>`;
    mainGroup.appendChild(chestLabel);
  }

  /**
   * Core filter function applied on all markers.
   */
  function filterMarkers() {
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      let mainVisible = true;
      mainGroup.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      let itemVisible = true;
      if (data.predefinedItemId) {
        const itemCb = itemFilterList.querySelector(
          `input[data-item-id="${data.predefinedItemId}"]`
        );
        if (itemCb && !itemCb.checked) itemVisible = false;
      }

      const shouldShow = matchesPvE && matchesName && mainVisible && itemVisible;
      const layerGroup = layers[data.type];
      if (!layerGroup) return;

      shouldShow ? layerGroup.addLayer(markerObj)
                 : layerGroup.removeLayer(markerObj);
    });
  }

  // Wire events
  searchBar?.addEventListener("input", filterMarkers);
  pveToggle?.addEventListener("change", filterMarkers);
  mainGroup.querySelectorAll("input[type=checkbox]")
    .forEach(cb => cb.addEventListener("change", filterMarkers));

  /**
   * Populates the item‐filter list from Firestore and wires change events.
   */
  async function loadItemFilters() {
    if (!itemFilterList) return;
    itemFilterList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" checked data-item-id="${d.id}" />
        <span>${d.name}</span>
      `;
      itemFilterList.appendChild(label);
      label.querySelector("input")
        .addEventListener("change", filterMarkers);
    });
  }

  return { filterMarkers, loadItemFilters };
}
