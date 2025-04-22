
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 2   The current file version is 2. Increase by 1 every time you update anything.
// @file:    /scripts/modules/sidebar/sidebarManager.js

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";
import { initTestItemDefinitionsModal } from "../ui/modals/testItemDefinitionsModal.js";

export async function setupSidebar(map, layers, allMarkers, db) {
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const mapContainer  = document.getElementById("map");
  const enableGroupingCb = document.getElementById("enable-grouping");

  if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
    console.warn("[sidebarManager] Missing elements");
    return { filterMarkers() {} };
  }

  // Initialize toggle button
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    // Move button to follow sidebar edge
    sidebarToggle.style.left = hidden ? "0px" : "300px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Accordion behavior
  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
  });

  // Marker grouping toggle (placeholder logic)
  enableGroupingCb.checked = false; // default disabled
  enableGroupingCb.addEventListener("change", () => {
    // implement grouping on/off logic here
    console.log("Enable grouping:", enableGroupingCb.checked);
  });

  // Core filter logic (as before)
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    allMarkers.forEach(({ markerObj, data }) => {
      const matchesName = data.name?.toLowerCase().includes(nameQuery);
      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });
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
        layerGroup.addLayer(markerObj);
      } else {
        layerGroup.removeLayer(markerObj);
      }
    });
  }

  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));

  // Populate item filters
  const itemFilterList = document.getElementById("item-filter-list");
  async function loadItemFilters() {
    itemFilterList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      const cb    = document.createElement("input");
      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.itemId = d.id;
      label.append(cb, ` ${d.name}`);
      itemFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadItemFilters();

  // Add test item modal button
  const testItemModal = initTestItemDefinitionsModal(db);
  const testItemBtn = document.createElement("button");
  testItemBtn.className = "ui-button";
  testItemBtn.textContent = "🧪 Test Item Modal";
  testItemBtn.onclick = () => testItemModal.open();
  sidebar.appendChild(testItemBtn);

  return { filterMarkers, loadItemFilters };
}

// @version: 2
