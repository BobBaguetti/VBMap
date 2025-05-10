// @file: src/modules/sidebar/sidebarManager.js
// @version: 10.4 — delegate filtering logic to sidebarFilters.js

import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal } from "../ui/modals/chestDefinitionsModal.js";
import { setupSidebarSettings }      from "./sidebarSettings.js";
import { setupSidebarFilters }       from "./sidebarFilters.js";

/**
 * Sets up the application sidebar:
 *  • UI toggles (open/close, group collapse)
 *  • Settings section (marker grouping, small markers)
 *  • Filters (search, PvE, main & item filters)
 *  • Admin tools buttons
 *
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export async function setupSidebar(
  map, layers, allMarkers, db,
  { enableGrouping, disableGrouping }
) {
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const settingsSect  = document.getElementById("settings-section");

  if (!searchBar || !sidebarToggle || !sidebar || !settingsSect) {
    console.warn("[sidebar] Missing elements");
    return { filterMarkers() {}, loadItemFilters: async () => {} };
  }

  // ─── Basic UI Setup ───────────────────────────────────────────────
  searchBar.classList.add("ui-input");

  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.log(`[sidebar] toggled ${group.id || header.textContent}`);
    });
  });

  // ─── Settings Section ────────────────────────────────────────────
  setupSidebarSettings(settingsSect, { enableGrouping, disableGrouping });

  // ─── Filtering Section ───────────────────────────────────────────
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

  // ─── Admin Tools ──────────────────────────────────────────────────
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

  // ─── Initial draw ────────────────────────────────────────────────
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
