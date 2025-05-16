// @file: src/bootstrap/index.js
// @version: 1.0 — orchestrate app startup with dedicated bootstrap modules

import { db, map, layers, clusterItemLayer, flatItemLayer } from "../appInit.js";
import { renderSidebarShell } from "../modules/sidebar/renderSidebar.js";
import { initSidebar       } from "../modules/sidebar/index.js";

import defsManager from "./definitionsManager.js";
import markerLoader from "./markerLoader.js";
import modalsManager from "./modalsManager.js";
import contextMenu from "./contextMenu.js";
import events from "./events.js";

/**
 * Initialize the entire UI.
 * @param {boolean} isAdmin – whether the current user is an admin
 */
export async function bootstrapUI(isAdmin) {
  // 1) Render sidebar shell and wire filters/admin tools
  renderSidebarShell();
  const { filterMarkers, loadItemFilters } = await initSidebar({
    map,
    layers,
    clusterItemLayer,
    flatItemLayer,
    db,
    isAdmin
  });

  // 2) Definitions (items & chests)
  await defsManager.init(db, loadItemFilters, filterMarkers);

  // 3) Markers (subscribe, clear, add, hydrate)
  await markerLoader.init(db, map, layers, clusterItemLayer, flatItemLayer, filterMarkers, loadItemFilters, isAdmin);

  // 4) Modals & copy/paste
  modalsManager.init(db, map);

  // 5) Context menu logic
  contextMenu.init(map, db, isAdmin);

  // 6) Global events (scrollbars, etc.)
  events.init();
}
