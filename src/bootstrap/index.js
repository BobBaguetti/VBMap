// @file: src/bootstrap/index.js
// @version: 1.3 — pass markerForm & copyMgr into markerLoader

import { db, map, clusterItemLayer, flatItemLayer, layers } from "../appInit.js";
import { renderSidebarShell } from "../modules/sidebar/renderSidebar.js";
import { initSidebar }        from "../modules/sidebar/index.js";

import defsManager    from "./definitionsManager.js";
import markerLoader   from "./markerLoader.js";
import modalsManager  from "./modalsManager.js";
import contextMenu    from "./contextMenu.js";
import events         from "./events.js";

export async function bootstrapUI(isAdmin) {
  // Sidebar
  renderSidebarShell();
  const { filterMarkers, loadItemFilters } = await initSidebar({
    map,
    layers,
    allMarkers: markerLoader.allMarkers,
    db,
    opts: { enableGrouping:()=>{}, disableGrouping:()=>{} },
    isAdmin
  });

  // Definitions
  await defsManager.init(db, loadItemFilters, filterMarkers);

  // Modals & Copy/Paste
  const { markerForm, copyMgr } = modalsManager.init(db, map);

  // Markers (pass callbacks)
  await markerLoader.init(
    db,
    map,
    clusterItemLayer,
    flatItemLayer,
    filterMarkers,
    loadItemFilters,
    isAdmin,
    { markerForm, copyMgr }
  );

  // Context Menu & Events
  contextMenu.init(map, db, isAdmin);
  events.init();
}
