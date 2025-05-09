// @file: src/uiBootstrap.js
// @version: 2 updated — replace renderPopup with renderItemPopup
// Subscribes to Firestore services, wires up marker CRUD, context menus, etc.


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
import { setupSidebar }             from "./modules/sidebar/sidebarManager.js";
import {
  showContextMenu,
  hideContextMenu
} from "./modules/ui/uiManager.js";
import { activateFloatingScrollbars } from "./modules/utils/scrollUtils.js";

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
    // Sidebar (filters, etc.)
    ({ filterMarkers, loadItemFilters } = await setupSidebar(
      map, layers, allMarkers, db, {}
    ));

    // Initial item definitions load
    const initialDefs = await loadItemDefinitions(db);
    itemDefMap = Object.fromEntries(initialDefs.map(d => [d.id, d]));

    // Subscribe to markers
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

    // Live item-definition hydration
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

    // Initialize modals and copy/paste
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

    // Context menu for creating markers
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

    // Hide context menu on outside click
    document.addEventListener("click", e => {
      const cm = document.getElementById("context-menu");
      if (cm?.style.display === "block" && !cm.contains(e.target)) {
        cm.style.display = "none";
      }
    });

    // Activate custom scrollbars once DOM is ready
    document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);
  })();
}