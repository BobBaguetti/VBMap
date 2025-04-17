// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 2
// @file:    /scripts/modules/sidebarManager.js

export async function setupSidebar(map, layers, allMarkers, db) {
  const searchBar        = document.getElementById("search-bar");
  const sidebarToggle    = document.getElementById("sidebar-toggle");
  const sidebar          = document.getElementById("sidebar");
  const enableGroupingCb = document.getElementById("enable-grouping");

  // Sidebar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    sidebarToggle.style.left = hidden ? "0px" : "300px";
    map.invalidateSize();
  });

  // Grouping off by default
  enableGroupingCb.checked = false;
  enableGroupingCb.addEventListener("change", () => {
    if (enableGroupingCb.checked) layers.Item.addTo(map);
    else {
      layers.Item.remove();
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type === "Item") map.addLayer(markerObj);
      });
    }
  });

  // Close context menu on left‑click
  document.addEventListener("click", () => {
    const cm = document.getElementById("context-menu");
    if (cm) cm.remove();
  });

  // Accordion filters
  document.querySelectorAll(".filter-group").forEach(g => {
    const h = g.querySelector("h3");
    h.addEventListener("click", () => g.classList.toggle("collapsed"));
  });

  // Filter logic
  function filterMarkers() {
    const q = (searchBar.value||"").toLowerCase();
    allMarkers.forEach(({ markerObj, data }) => {
      const matchesName = data.name?.toLowerCase().includes(q);
      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) mainVisible = false;
      });
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = document.querySelector(`#item-filter-list input[data-item-id="${data.predefinedItemId}"]`);
        if (cb && !cb.checked) itemVisible = false;
      }
      const show = matchesName && mainVisible && itemVisible;
      const layerGroup = layers[data.type];
      if (!layerGroup) return;
      show ? layerGroup.addLayer(markerObj) : layerGroup.removeLayer(markerObj);
    });
  }

  searchBar.addEventListener("input", filterMarkers);
  document.querySelectorAll("#main-filters .toggle-group input")
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

  return { filterMarkers, loadItemFilters };
}
