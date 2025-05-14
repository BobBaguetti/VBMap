// @file: src/modules/sidebar/index.js
// @version: 12.1 — full initSidebar with updated filter and settings wiring

import { setupSidebarUI }       from "./sidebarUI.js";
import { setupSidebarSettings } from "./sidebarSettings.js";
import { setupSidebarFilters }  from "./sidebarFilters.js";
import { setupSidebarAdmin }    from "./sidebarAdmin.js";

/**
 * Bootstraps the application sidebar:
 *  1) Basic UI (search, mobile toggle, sticky header, group & master toggles)
 *  2) Settings modal (marker grouping, small markers)
 *  3) Filters (search, PvE, Main, Chest, NPC, Item)
 *  4) Admin tools buttons
 *
 * @param {object} params
 * @param {L.Map}    params.map
 * @param {object<string,L.LayerGroup>} params.layers
 * @param {Array<{markerObj: L.Marker, data: object}>} params.allMarkers
 * @param {firebase.firestore.Firestore} params.db
 * @param {object}  params.opts                       – behavior hooks
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

  // 3) Filters
  //    Pass only the selectors and data needed by the filters module.
  const { filterMarkers, loadItemFilters } = setupSidebarFilters({
    mainFiltersSelector:     "#main-filters .toggle-group",
    chestFilterListSelector: "#chest-filter-list",
    npcHostileListSelector:  "#npc-hostile-list",
    npcFriendlyListSelector: "#npc-friendly-list",
    itemFilterListSelector:  "#item-filter-list",
    layers,
    allMarkers,
    db
  });
  // Load the async item filters, then perform an initial draw
  await loadItemFilters();
  filterMarkers();

  // 4) Admin tools
  const sidebarEl = document.getElementById("sidebar");
  if (!sidebarEl) {
    console.warn("[sidebar] Missing sidebar container");
  } else {
    setupSidebarAdmin(sidebarEl, db);
  }

  return { filterMarkers, loadItemFilters };
}
