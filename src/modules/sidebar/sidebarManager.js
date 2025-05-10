// @file: src/modules/sidebar/sidebarManager.js
// @version: 2.6 — pass `layers` into filters

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
  const settingsContainer =
    sidebar.querySelector("#settings-section") ||
    sidebar.querySelector(".sidebar__settings");
  if (!settingsContainer) {
    console.error("[sidebar] could not find settings container");
    return {};
  }

  renderSidebarSettings(settingsContainer, callbacks);

  // ← pass `layers` here
  const { filterMarkers, loadItemFilters } = await renderSidebarFilters(
    allMarkers,
    db,
    layers
  );

  return { filterMarkers, loadItemFilters };
}
