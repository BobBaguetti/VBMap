// @file: src/modules/sidebar/index.js
// @version: 12.3 — pass full filter selectors into setupSidebarSearch

import { setupSidebarUI }      from "./sidebarUI.js";
import { setupSidebarFilters } from "./sidebarFilters.js";
import { setupSidebarAdmin }   from "./sidebarAdmin.js";
import { setupSidebarSearch }  from "./search.js";

/**
 * Bootstraps the application sidebar:
 *  1) Basic UI (search, mobile toggle, sticky header, group & master toggles)
 *  2) Filters (search, PvE, layer & item/chest/NPC filters)
 *  3) Admin tools buttons
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
 * @returns {Promise<{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }>}
 */
export async function initSidebar(
  { map, layers, allMarkers, db, opts: { enableGrouping, disableGrouping } }
) {
  // 1) Basic UI wiring
  setupSidebarUI({ map });

  // 2) Filtering Section
  const { filterMarkers, loadItemFilters } =
    await setupSidebarFilters({
      searchBarSelector:      "#search-bar",
      mainFiltersSelector:    "#main-filters .toggle-group",
      pveToggleSelector:      "#toggle-pve",
      itemFilterListSelector: "#item-filter-list",
      chestFilterListSelector:"#chest-filter-list",
      npcHostileListSelector: "#npc-hostile-list",
      npcFriendlyListSelector:"#npc-friendly-list",
      layers,
      allMarkers,
      db
    });

  // Initial load of item filters and markers
  await loadItemFilters();
  filterMarkers();

  // 2a) Wire search with callbacks (selectors for all filter groups)
  setupSidebarSearch({
    searchBarSelector:       "#search-bar",
    clearButtonSelector:     "#search-clear",
    suggestionsListSelector: "#search-suggestions",
    mainFiltersSelector:     "#main-filters .toggle-group",
    chestFilterListSelector: "#chest-filter-list",
    npcHostileListSelector:  "#npc-hostile-list",
    npcFriendlyListSelector: "#npc-friendly-list"
  });

  // 3) Admin Tools
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.warn("[sidebar] Missing sidebar container");
  } else {
    setupSidebarAdmin(sidebar, db);
  }

  // 4) Initial draw of markers
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
