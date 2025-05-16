// @file: src/modules/sidebar/index.js 
// @version: 12.0 — remove Settings section wiring; delegate only UI, filters, and admin

import { setupSidebarUI }      from "./sidebarUI.js";
import { setupSidebarFilters } from "./sidebarFilters.js";
import { setupSidebarAdmin }   from "./sidebarAdmin.js";

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

  // 2) Filtering Section
  const { filterMarkers, loadItemFilters } = setupSidebarFilters({
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
  await loadItemFilters();

  // 3) Admin Tools
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.warn("[sidebar] Missing sidebar container");
  } else {
    setupSidebarAdmin(sidebar, db);
  }

  // 4) Initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
