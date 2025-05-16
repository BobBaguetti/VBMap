// @file: src/uiBootstrap.js
// @version: 6.1 — fixed import paths for map and uiManager

// ─── CORE APP INIT ─────────────────────────────────────────────────────────
import { map, clusterItemLayer, flatItemLayer, layers } from "./appInit.js";

// ─── UI UTILITIES ──────────────────────────────────────────────────────────
import { showContextMenu, hideContextMenu }            from "./modules/ui/uiManager.js";
import { activateFloatingScrollbars }                  from "./modules/utils/scrollUtils.js";

// ─── SIDEBAR ──────────────────────────────────────────────────────────────
import { renderSidebarShell }  from "./modules/sidebar/renderSidebar.js";
import { initSidebar }         from "./modules/sidebar/index.js";

// ─── INITIALIZERS ─────────────────────────────────────────────────────────
import { initDefinitions }     from "./modules/initializer/definitionsLoader.js";
import { initMarkers }         from "./modules/initializer/markerHydrator.js";
import { initModals }          from "./modules/initializer/modalInitializer.js";
import { initContextMenu }     from "./modules/initializer/contextMenuHandler.js";

// ─── OTHER SERVICES ────────────────────────────────────────────────────────
import { upsertMarker }        from "./modules/services/firebaseService.js";
import { initCopyPasteManager } from "./modules/map/copyPasteManager.js";

/**
 * Bootstraps the UI: sidebar, definitions, markers, modals, context menu, and scrollbars.
 */
export function bootstrapUI(isAdmin) {
  // 1) Render sidebar shell & initialize sidebar behaviors
  renderSidebarShell();
  const { filterMarkers, loadItemFilters } = initSidebar({
    map,
    layers,
    allMarkers: [], // populated by markerHydrator
    db: null,
    opts: {
      enableGrouping:  () => {},
      disableGrouping: () => {}
    }
  });

  // 2) Initialize definitions & marker hydration
  initDefinitions();
  initMarkers(isAdmin);

  // 3) Initialize modals (marker creation/editing and definitions)
  const { markerForm } = initModals();

  // 4) Initialize copy/paste for markers
  initCopyPasteManager(map, upsertMarker);

  // 5) Context menu logic
  initContextMenu(isAdmin, markerForm, upsertMarker);

  // 6) Activate custom scrollbars
  document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);
}
