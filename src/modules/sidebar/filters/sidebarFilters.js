// @file: src/modules/sidebar/filters/sidebarFilters.js
// @version: 1.0 — aggregate main & item filters and filtering logic

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

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

  // 1) Top–level Filters (Items vs Chests) + PvE toggle
  const mainGroup = document.createElement("div");
  mainGroup.id = "main-filters";
  mainGroup.className = "filter-group";
  mainGroup.innerHTML = `<h3>Main Filters</h3>`;
  const tg = document.createElement("div");
  tg.className = "toggle-group";
  // Item toggle
  const itemLabel = document.createElement("label");
  itemLabel.innerHTML = `<input type="checkbox" checked data-layer="Item"><span>Items</span>`;
  tg.append(itemLabel);
  // Chest toggle
  const chestLabel = document.createElement("label");
  chestLabel.innerHTML = `<input type="checkbox" checked data-layer="Chest"><span>Chests</span>`;
  tg.append(chestLabel);
  // PvE toggle
  const pveLabel = document.createElement("label");
  pveLabel.innerHTML = `<input type="checkbox" id="toggle-pve" checked><span>Show PvE Items</span>`;
  tg.append(pveLabel);
  mainGroup.append(tg);
  filtersContainer.appendChild(mainGroup);

  // 2) Item–specific Filters
  const itemGroup = document.createElement("div");
  itemGroup.id = "item-filter-list";
  itemGroup.className = "filter-group";
  itemGroup.innerHTML = `<h3>Item Filters</h3>`;
  filtersContainer.appendChild(itemGroup);

  // 3) Core filtering logic
  const searchBar = document.getElementById("search-bar");
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = document.getElementById("toggle-pve")?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main group visibility
      let mainVisible = true;
      mainGroup.querySelectorAll("input[data-layer]").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      // Per‐item visibility (if this is a predefined item)
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = itemGroup.querySelector(
          `input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      const shouldShow = matchesPvE && matchesName && mainVisible && itemVisible;
      const layer = markerObj; // we'll rely on markerObj.remove/add in callers

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

  // Wire up top‐level toggles and search
  mainGroup.querySelectorAll("input[data-layer]").forEach(cb =>
    cb.addEventListener("change", filterMarkers)
  );
  document.getElementById("toggle-pve")?.addEventListener("change", filterMarkers);
  searchBar?.addEventListener("input", filterMarkers);

  // 4) Load item definitions into item filters
  async function loadItemFilters() {
    itemGroup.innerHTML = `<h3>Item Filters</h3>`;
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" checked data-item-id="${d.id}"><span>${d.name}</span>`;
      const cb = label.querySelector("input");
      cb.addEventListener("change", filterMarkers);
      itemGroup.appendChild(label);
    });
    return defs.map(d => d.id);
  }

  // Initial load
  await loadItemFilters();
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
