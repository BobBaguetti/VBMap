// @file: src/modules/sidebar/sidebarManager.js
// @version: 10.5 — delegate UI, settings, and filters to dedicated modules

import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal } from "../ui/modals/chestDefinitionsModal.js";

import { setupSidebarUI }            from "./sidebarUI.js";
import { setupSidebarSettings }      from "./sidebarSettings.js";
import { setupSidebarFilters }       from "./sidebarFilters.js";

/**
 * Sets up the application sidebar:
 *  1) Basic UI (toggle, search‐bar styling, group collapse)
 *  2) Settings section (marker grouping, small markers)
 *  3) Filters (search, PvE, main & item filters)
 *  4) Admin tools buttons
 *
 * @param {L.Map} map
 * @param {object<string,L.LayerGroup>} layers
 * @param {Array<{markerObj: L.Marker, data: object}>} allMarkers
 * @param {firebase.firestore.Firestore} db
 * @param {{ enableGrouping: () => void, disableGrouping: () => void }} opts
 *
 * @returns {{ filterMarkers: () => void, loadItemFilters: () => Promise<void> }}
 */
export async function setupSidebar(
  map, layers, allMarkers, db,
  { enableGrouping, disableGrouping }
) {
  // 1) Basic UI wiring
  setupSidebarUI({ map });

  // 2) Settings Section
  const settingsSect = document.getElementById("settings-section");
  if (!settingsSect) {
    console.warn("[sidebar] Missing settings section");
    return { filterMarkers() {}, loadItemFilters: async () => {} };
  }
  setupSidebarSettings(settingsSect, { enableGrouping, disableGrouping });

  // 3) Filtering Section
  const { filterMarkers, loadItemFilters } = setupSidebarFilters({
    searchBarSelector:      "#search-bar",
    mainFiltersSelector:    "#main-filters .toggle-group",
    pveToggleSelector:      "#toggle-pve",
    itemFilterListSelector: "#item-filter-list",
    layers,
    allMarkers,
    db
  });
  await loadItemFilters();

  // 4) Admin Tools
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.warn("[sidebar] Missing sidebar container");
  } else {
    sidebar.querySelector(".admin-header")?.remove();
    sidebar.querySelector("#sidebar-admin-tools")?.remove();

    const adminHeader = document.createElement("h2");
    adminHeader.className   = "admin-header";
    adminHeader.textContent = "🛠 Admin Tools";
    adminHeader.style.display = "none";
    sidebar.appendChild(adminHeader);

    const adminWrap = document.createElement("div");
    adminWrap.id = "sidebar-admin-tools";
    adminWrap.style.display = "none";

    [
      ["Manage Items",  () => initItemDefinitionsModal(db).open()],
      ["Manage Chests", () => initChestDefinitionsModal(db).open()]
    ].forEach(([txt, fn]) => {
      const btn = document.createElement("button");
      btn.textContent = txt;
      btn.onclick     = fn;
      adminWrap.appendChild(btn);
    });

    sidebar.appendChild(adminWrap);

    if (document.body.classList.contains("is-admin")) {
      adminHeader.style.display = "";
      adminWrap.style.display   = "";
    }
  }

  // 5) Initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
