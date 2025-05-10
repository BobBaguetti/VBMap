// @file: src/modules/sidebar/sidebarManager.js
// @version: 2.5 — integrate updated renderSidebarFilters signature

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
  const sidebar = document.getElementById("sidebar");

  // Settings section is still dynamically rendered
  const settingsContainer =
    sidebar.querySelector("#settings-section") ||
    sidebar.querySelector(".sidebar__settings");
  if (!settingsContainer) {
    console.error("[sidebar] could not find settings container");
    return {};
  }

  // Render the Settings panel
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

  // Filters now hook into the static HTML (#main-filters, #item-filter-list)
  const { filterMarkers, loadItemFilters } = await renderSidebarFilters(
    allMarkers,
    db
  );

  return { filterMarkers, loadItemFilters };
}
