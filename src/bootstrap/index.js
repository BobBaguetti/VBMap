// @file: src/bootstrap/index.js
// @version: 1.2 — wire up clusterItemLayer & flatItemLayer to markerLoader

import { db, map, layers, clusterItemLayer, flatItemLayer } from "../appInit.js";
import { renderSidebarShell } from "../modules/sidebar/renderSidebar.js";
import { initSidebar } from "../modules/sidebar/index.js";

import defsManager   from "./definitionsManager.js";
import markerLoader  from "./markerLoader.js";
import modalsManager from "./modalsManager.js";
import contextMenu   from "./contextMenu.js";
import events        from "./events.js";

export async function bootstrapUI(isAdmin) {
  // 1) Render the sidebar shell
  renderSidebarShell();

  // 2) Wire up sidebar with grouping stubs and marker list
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

  // 3) Definitions
  await defsManager.init(db, loadItemFilters, filterMarkers);

  // 4) Markers (subscribe, clear, add, hydrate)
  await markerLoader.init(
    db,
    map,
    clusterItemLayer,
    flatItemLayer,
    filterMarkers,
    loadItemFilters,
    isAdmin
  );

  // 5) Modals & copy/paste
  modalsManager.init(db, map);

  // 6) Context menu logic
  contextMenu.init(map, db, isAdmin);

  // 7) Global events
  events.init();
}
