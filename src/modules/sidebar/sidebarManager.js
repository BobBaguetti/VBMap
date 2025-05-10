// @file: src/modules/sidebar/sidebarManager.js
// @version: 2.4 — flexible selectors for settings/filters

import { renderSidebarSettings } from "./settings/sidebarSettings.js";
import { renderSidebarFilters }  from "./filters/sidebarFilters.js";

export async function setupSidebar(
  map,
  layers,
  allMarkers,
  db,
  callbacks
) {
  const sidebar = document.getElementById("sidebar");

  // Try both ID and class selectors (fall back if one is missing)
  const settingsContainer =
    sidebar.querySelector("#settings-section") ||
    sidebar.querySelector(".sidebar__settings");
  if (!settingsContainer) {
    console.error("[sidebar] could not find settings container");
    return {};
  }

  const filtersContainer =
    sidebar.querySelector("#filters-section") ||
    sidebar.querySelector(".sidebar__filters");
  if (!filtersContainer) {
    console.error("[sidebar] could not find filters container");
    return {};
  }

  renderSidebarSettings(settingsContainer, callbacks);

  const { filterMarkers, loadItemFilters } = await renderSidebarFilters(
    filtersContainer,
    allMarkers,
    db
  );

  return { filterMarkers, loadItemFilters };
}
