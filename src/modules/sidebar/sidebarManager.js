// @file: src/modules/sidebar/sidebarManager.js
// @version: 10.6 — delegate UI, settings, filters, and admin-tools to dedicated modules

import { setupSidebarUI }       from "./sidebarUI.js";
import { setupSidebarSettings } from "./sidebarSettings.js";
import { setupSidebarFilters }  from "./sidebarFilters.js";
import { setupSidebarAdmin }    from "./sidebarAdmin.js";

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
    setupSidebarAdmin(sidebar, db);
  }

  // 5) Initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
