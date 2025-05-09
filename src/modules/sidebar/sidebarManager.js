// @file: src/modules/sidebar/sidebarManager.js
// @version: 1

import { initCore } from "./sidebarCore.js";
import { initSettings } from "./sidebarSettings.js";
import { createFilterLogic } from "./sidebarFilters.js";
import { loadItemFilters } from "./itemFilters.js";
import { initAdminTools } from "./sidebarAdmin.js";

/**
 * Set up the sidebar: core UI, settings toggles, filters, and admin tools.
 *
 * @param {L.Map} map
 * @param {{ [type: string]: L.LayerGroup }} layers
 * @param {Array} allMarkers
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<{ filterMarkers: Function, loadItemFilters: Function }>}
 */
export async function setupSidebar(map, layers, allMarkers, db) {
  const { sidebar, searchBar, settingsSection, filterSection } = initCore(map);

  initSettings(settingsSection, {
    enableGrouping: () => layers.clusterGroup.enable(),
    disableGrouping: () => layers.clusterGroup.disable()
  });

  const filterMarkers = createFilterLogic(allMarkers, layers, searchBar);
  await loadItemFilters(db, filterSection.querySelector("#item-filter-list"), filterMarkers);

  initAdminTools(sidebar, db);

  // Initial draw
  filterMarkers();
  return { filterMarkers, loadItemFilters: () => loadItemFilters(db, filterSection.querySelector("#item-filter-list"), filterMarkers) };
}
