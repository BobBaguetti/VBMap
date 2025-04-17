// scripts/modules/sidebarManager.js

import { loadItemDefinitions } from "./itemDefinitionsService.js";

/**
 * Sets up sidebar behavior:
 * - Toggle show/hide with arrow button
 * - Accordion groups for Main & Item filters
 * - Live filtering of markers by name, layer and item
 */
export async function setupSidebar(map, layers, allMarkers, db) {
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const mapContainer  = document.getElementById("map");

  if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
    console.warn("[sidebarManager] Missing elements");
    return { filterMarkers() {} };
  }

  // Initialize toggle button arrow
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Accordion behavior for filter groups
  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
  });

  // Core filter function
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    allMarkers.forEach(({ markerObj, data }) => {
      // Name match
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main filters
      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      // Item filters
      let itemVisible = true;
      if (data.predefinedItemId) {
        const itemCb = document.querySelector(
          `#item-filter-list input[data-item-id="${data.predefinedItemId}"]`
        );
        if (itemCb && !itemCb.checked) itemVisible = false;
      }

      const shouldShow = matchesName && mainVisible && itemVisible;
      const layerGroup = layers[data.type];
      if (!layerGroup) return;

      if (shouldShow) {
        if (!layerGroup.hasLayer(markerObj)) layerGroup.addLayer(markerObj);
      } else {
        layerGroup.removeLayer(markerObj);
      }
    });
  }

  // Wire up search input
  searchBar.addEventListener("input", filterMarkers);

  // Wire up main filter toggles
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));

  // Populate item filters from item definitions flagged showInFilters
  const itemFilterList = document.getElementById("item-filter-list");
  async function loadItemFilters() {
    const defs = await loadItemDefinitions(db);
    itemFilterList.innerHTML = "";
    defs
      .filter(d => d.showInFilters)
      .forEach(d => {
        const label = document.createElement("label");
        const cb    = document.createElement("input");
        cb.type             = "checkbox";
        cb.checked          = true;
        cb.dataset.itemId   = d.id;
        label.append(cb, ` ${d.name}`);
        itemFilterList.append(label);
        cb.addEventListener("change", filterMarkers);
      });
  }
  await loadItemFilters();

  return { filterMarkers, loadItemFilters };
}