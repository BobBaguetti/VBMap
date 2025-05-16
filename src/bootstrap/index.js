// @file: src/bootstrap/index.js
// @version: 1.2 — import and pass clusterItemLayer & flatItemLayer correctly

import { db, map, clusterItemLayer, flatItemLayer } from "../appInit.js";
import { renderSidebarShell }             from "../modules/sidebar/renderSidebar.js";
import { initSidebar }                    from "../modules/sidebar/index.js";

import defsManager    from "./definitionsManager.js";
import markerLoader   from "./markerLoader.js";
import modalsManager  from "./modalsManager.js";
import contextMenu    from "./contextMenu.js";
import events         from "./events.js";

export async function bootstrapUI(isAdmin) {
  // 1) Render sidebar shell
  renderSidebarShell();

  // 2) Initialize sidebar (pass in layers object)
  const layers = { clusterItemLayer, flatItemLayer };
  const { filterMarkers, loadItemFilters } = await initSidebar({
    map,
    layers,
    allMarkers: markerLoader.allMarkers,
    db,
    opts: {
      enableGrouping: () => {},
      disableGrouping: () => {}
    },
    isAdmin
  });

  // 3) Definitions (items & chests)
  await defsManager.init(db, loadItemFilters, filterMarkers);

  // 4) Markers (subscribe, clear, add, hydrate)
  await markerLoader.init(
    db,
    map,
    layers,
    filterMarkers,
    loadItemFilters,
    isAdmin
  );

  // 5) Modals & copy/paste
  modalsManager.init(db, map);

  // 6) Context menu logic
  contextMenu.init(map, db, isAdmin);

  // 7) Global events (scrollbars, etc.)
  events.init();
}
