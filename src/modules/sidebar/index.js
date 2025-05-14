// @file: src/modules/sidebar/index.js
// @version: 12.0 — removed in-sidebar settings section; wire toolbar settings modal

import { setupSidebarUI }       from "./sidebarUI.js";
import { setupSidebarSettings } from "./sidebarSettings.js";
import { setupSidebarFilters }  from "./sidebarFilters.js";
import { setupSidebarAdmin }    from "./sidebarAdmin.js";

/**
 * Bootstraps the application sidebar:
 *  1) Basic UI (search, mobile toggle, sticky header, group & master toggles)
 *  2) Settings modal (marker grouping, small markers)
 *  3) Filters (search, PvE, layer & item/chest/NPC filters)
 *  4) Admin tools buttons
 *
 * @param {object} params
 * @param {L.Map}    params.map
 * @param {object<string,L.LayerGroup>} params.layers
 * @param {Array<{markerObj: L.Marker, data: object}>} params.allMarkers
 * @param {firebase.firestore.Firestore} params.db
 * @param {object}  params.opts                        – behavior hooks
 * @param {() => void} params.opts.enableGrouping
 * @param {() => void} params.opts.disableGrouping
 *
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export async function initSidebar(
  { map, layers, allMarkers, db, opts: { enableGrouping, disableGrouping } }
) {
  // 1) Basic UI wiring
  setupSidebarUI({ map });

  // 2) Settings modal (toolbar button)
  setupSidebarSettings({ enableGrouping, disableGrouping });

  // 3) Filtering Section
  const { filterMarkers, loadItemFilters } = setupSidebarFilters({
    searchBarSelector:       "#search-bar",
    mainFiltersSelector:     "#main-filters .toggle-group",
    pveToggleSelector:       "#toggle-pve",
    itemFilterListSelector:  "#item-filter-list",
    chestFilterListSelector: "#chest-filter-list",
    // Pass hostile and friendly separately:
    npcHostileListSelector:  "#npc-hostile-list",
    npcFriendlyListSelector: "#npc-friendly-list",
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
