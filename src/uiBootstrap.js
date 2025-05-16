// @file: src/uiBootstrap.js
// @version: 4 — render sidebar shell before wiring up behaviors

import { db, map, layers, clusterItemLayer, flatItemLayer } from "./appInit.js";

// Services under src/modules/services/
import {
  subscribeMarkers,
  upsertMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";
import { subscribeChestDefinitions } from "./modules/services/chestDefinitionsService.js";
import {
  subscribeItemDefinitions,
  loadItemDefinitions
} from "./modules/services/itemDefinitionsService.js";

// Map & UI under src/modules/
import {
  createMarker,
  createCustomIcon,
  renderItemPopup,
  renderChestPopup
} from "./modules/map/markerManager.js";
import { initMarkerModal }          from "./modules/ui/modals/markerModal.js";
import { initItemDefinitionsModal } from "./modules/ui/modals/itemDefinitionsModal.js";
import { initCopyPasteManager }     from "./modules/map/copyPasteManager.js";
import { showContextMenu, hideContextMenu } from "./modules/ui/uiManager.js";
import { activateFloatingScrollbars }       from "./modules/utils/scrollUtils.js";

// Sidebar rendering & orchestration
import { renderSidebarShell } from "./modules/sidebar/renderSidebar.js";
import { initSidebar }        from "./modules/sidebar/index.js";

let chestDefMap = {};
let itemDefMap  = {};
export let allMarkers = [];
let filterMarkers, loadItemFilters;

export function bootstrapUI(isAdmin) {
  // Keep chest definitions up to date
  subscribeChestDefinitions(db, defs => {
    chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
  });

  (async () => {
    // 0) Render the static sidebar shell
    renderSidebarShell();

    // 1) Sidebar (filters, settings, admin tools)
    ({ filterMarkers, loadItemFilters } = await initSidebar({
      map,
      layers,
      allMarkers,
      db,
      opts: {
        enableGrouping:  () => {},   // implement grouping enable logic
        disableGrouping: () => {}    // implement grouping disable logic
      }
    }));

    // 2) Initial item definitions load
    const initialDefs = await loadItemDefinitions(db);
    itemDefMap = Object.fromEntries(initialDefs.map(d => [d.id, d]));

    // 3) Subscribe to markers
    subscribeMarkers(db, markers => {
      // Clear old markers
      allMarkers.forEach(({ markerObj }) => {
        markerObj.remove();
        clusterItemLayer.removeLayer(markerObj);
      });
      allMarkers.length = 0;

      // Add new ones
      markers.forEach(data => addMarker(data));
      loadItemFilters().then(filterMarkers);
    });

    // 4) Live item-definition hydration
    subscribeItemDefinitions(db, async () => {
      const defs = await loadItemDefinitions(db);
      itemDefMap = Object.fromEntries(defs.map(d => [d.id, d]));

      allMarkers.forEach(({ markerObj, data }) => {
        if (data.predefinedItemId) {
          const def = itemDefMap[data.predefinedItemId] || {};
          const { id: _ignore, ...fields } = def;
          Object.assign(data, fields);

          markerObj.setIcon(createCustomIcon(data));
          markerObj.setPopupContent(renderItemPopup(data));
          if (isAdmin) firebaseUpdateMarker(db, data).catch(() => {});
        } else if (data.type === "Chest") {
          const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
          const fullDef = {
            ...def,
            lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
          };
          markerObj.setPopupContent(renderChestPopup(fullDef));
        }
      });

      filterMarkers();
    });

    // 5) Initialize modals and copy/paste
    const markerForm = initMarkerModal(db);
    initItemDefinitionsModal(db);
    const copyMgr = initCopyPasteManager(map, upsertMarker.bind(null, db));

    // Helper for adding markers
    function addMarker(data) {
      if (data.type === "Chest") {
        const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
        const fullDef = {
          ...def,
          lootPool: def.lootPool.map(id => itemDefMap[id]).filter(Boolean)
        };
        data.name         = fullDef.name;
        data.imageSmall   = fullDef.iconUrl;
        data.chestDefFull = fullDef;

        const markerObj = createMarker(
          data, map, layers, showContextMenu, callbacks, isAdmin
        );
        markerObj.setPopupContent(renderChestPopup(fullDef));
        allMarkers.push({ markerObj, data });
        return;
      }

      const markerObj = createMarker(
        data, map, layers, showContextMenu, callbacks, isAdmin
      );
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);
      markerObj.setPopupContent(renderItemPopup(data));
      allMarkers.push({ markerObj, data });
    }

    // Common callbacks for edit/copy/drag/delete
    const callbacks = {
      onEdit: (m, d, e) => markerForm.openEdit(m, d, e, updated => {
        m.setIcon(createCustomIcon(updated));
        m.setPopupContent(
          updated.type === "Chest"
            ? renderChestPopup(updated.chestDefFull || {})
            : renderItemPopup(updated)
        );
        firebaseUpdateMarker(db, updated).catch(() => {});
      }),
      onCopy: (_, d)    => copyMgr.startCopy(d),
      onDragEnd: (_, d) => firebaseUpdateMarker(db, d).catch(() => {}),
      onDelete: (markerObj, data) => {
        markerObj.remove();
        clusterItemLayer.removeLayer(markerObj);
        const idx = allMarkers.findIndex(o => o.data.id === data.id);
        if (idx !== -1) allMarkers.splice(idx, 1);
        if (data.id) firebaseDeleteMarker(db, data.id).catch(() => {});
        hideContextMenu();
      }
    };

    // 6) Context menu for creating markers
    map.on("contextmenu", evt => {
      if (!isAdmin) return;
      showContextMenu(
        evt.originalEvent.pageX,
        evt.originalEvent.pageY,
        [{
          text: "Create New Marker",
          action: () => markerForm.openCreate(
            [evt.latlng.lat, evt.latlng.lng],
            undefined,
            evt.originalEvent,
            upsertMarker.bind(null, db)
          )
        }]
      );
    });

    // 7) Hide context menu on outside click
    document.addEventListener("click", e => {
      const cm = document.getElementById("context-menu");
      if (cm?.style.display === "block" && !cm.contains(e.target)) {
        cm.style.display = "none";
      }
    });

    // 8) Activate custom scrollbars once DOM is ready
    document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);
  })();
}
