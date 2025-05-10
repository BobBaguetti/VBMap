// @file: src/modules/sidebar/sidebarManager.js
// @version: 2.3 — fix filters selector to match HTML ID

import { renderSidebarSettings } from "./settings/sidebarSettings.js";
import { renderSidebarFilters }  from "./filters/sidebarFilters.js";

/**
 * Sets up the sidebar’s Settings and Filters sections.
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

  // Settings container
  const settingsContainer = sidebar.querySelector("#settings-section");
  if (!settingsContainer) {
    console.error("[sidebar] could not find #settings-section");
    return {};
  }

  // Filters container (use the ID from your HTML)
  const filtersContainer = sidebar.querySelector("#filters-section");
  if (!filtersContainer) {
    console.error("[sidebar] could not find #filters-section");
    return {};
  }

  // Render Settings
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

  // Render Filters (main + item filters)
  const { filterMarkers, loadItemFilters } = await renderSidebarFilters(
    filtersContainer,
    allMarkers,
    db
  );

  return { filterMarkers, loadItemFilters };
}
