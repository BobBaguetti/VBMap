// @file: src/bootstrap/index.js
// @version: 1.4 — slimmed down; “settings” logic moved to settingsController

import { db, map, clusterItemLayer, flatItemLayer, layers } from "../appInit.js";
import { renderSidebarShell } from "../modules/sidebar/renderSidebar.js";
import { initSidebar }        from "../modules/sidebar/index.js";

import defsManager    from "./definitionsManager.js";
import markerLoader   from "./markerLoader.js";
import modalsManager  from "./modalsManager.js";
import contextMenu    from "./contextMenu.js";
import events         from "./events.js";

// Import the new settings‐toggle module
import { initSettingsToggles } from "./settingsController.js";

/**
 * Bootstraps the UI: sidebar, definitions, modals, markers, and event hooks.
 *
 * @param {boolean} isAdmin – whether the user is authenticated as admin
 */
export async function bootstrapUI(isAdmin) {
  // ── 1) Render the sidebar skeleton & wire up filters ─────────────
  renderSidebarShell();

  const { filterMarkers, loadItemFilters } = await initSidebar({
    map,
    layers,
    allMarkers: markerLoader.allMarkers,
    db,
    // We no longer need “opts.enableGrouping” or “opts.disableGrouping” here,
    // because grouping is handled by settingsController.
    opts: { enableGrouping: () => {}, disableGrouping: () => {} },
    isAdmin
  });

  // ── 2) Initialize definitions (so sidebar filters have data) ─────
  await defsManager.init(db, loadItemFilters, filterMarkers);

  // ── 3) Initialize modals (e.g. marker‐creation/edit forms) ───────
  const { markerForm, copyMgr } = modalsManager.init(db, map);

  // ── 4) Initialize markers (pull from Firestore, create Leaflet markers)
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

  // ── 5) Context menu & other global events ───────────────────────
  contextMenu.init(map, db, isAdmin);
  events.init();

  // ── 6) Finally, wire up Settings‐Modal toggles (grouping + small‐markers)
  initSettingsToggles(map, clusterItemLayer, flatItemLayer, filterMarkers);
}
