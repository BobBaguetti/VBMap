// @file: src/modules/sidebar/sidebarManager.js
// @version: 2.1 — wire in modular settings & filters

import { renderSidebarSettings } from "./settings/sidebarSettings.js";
import { renderSidebarFilters }  from "./filters/sidebarFilters.js";

/**
 * Sets up the sidebar’s Settings and Filters sections.
 *
 * @param {L.Map} map
 * @param {object<string,L.LayerGroup>} layers
 * @param {Array<{ markerObj: L.Marker, data: object }>} allMarkers
 * @param {firebase.firestore.Firestore} db
 * @param {object} callbacks
 * @param {() => void} callbacks.enableGrouping
 * @param {() => void} callbacks.disableGrouping
 * @param {() => void} callbacks.shrinkMarkers
 * @param {() => void} callbacks.resetMarkerSize
 * @param {() => void} callbacks.onManageItems
 * @param {() => void} callbacks.onManageChests
 * @param {() => void} callbacks.onMultiSelectMode
 * @param {() => void} callbacks.onDeleteMode
 * @returns {Promise<{ filterMarkers: Function, loadItemFilters: Function }>}
 */
export async function setupSidebar(
  map,
  layers,
  allMarkers,
  db,
  {
    enableGrouping,
    disableGrouping,
    shrinkMarkers,
    resetMarkerSize,
    onManageItems,
    onManageChests,
    onMultiSelectMode,
    onDeleteMode
  }
) {
  // Locate sidebar regions
  const sidebar           = document.getElementById("sidebar");
  const settingsContainer = sidebar.querySelector(".sidebar__settings");
  const filtersContainer  = sidebar.querySelector(".sidebar__filters");

  // Render the Settings section
  renderSidebarSettings(settingsContainer, {
    enableGrouping,
    disableGrouping,
    shrinkMarkers,
    resetMarkerSize,
    onManageItems,
    onManageChests,
    onMultiSelectMode,
    onDeleteMode
  });

  // Render the Filters section (main + item filters)
  const { filterMarkers, loadItemFilters } = await renderSidebarFilters(
    filtersContainer,
    allMarkers,
    db
  );

  return { filterMarkers, loadItemFilters };
}
