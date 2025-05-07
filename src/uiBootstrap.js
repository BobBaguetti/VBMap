// @file: src/uiBootstrap.js
// Subscribes to Firestore services, wires up marker CRUD, context menus, etc.

import { db, map, layers, clusterItemLayer, flatItemLayer } from "./appInit.js";

import {
  subscribeMarkers,
  upsertMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../scripts/modules/services/firebaseService.js";

import { subscribeChestDefinitions } from "../scripts/modules/services/chestDefinitionsService.js";
import {
  subscribeItemDefinitions,
  loadItemDefinitions
} from "../scripts/modules/services/itemDefinitionsService.js";

import {
  createMarker,
  createCustomIcon,
  renderPopup,
  renderChestPopup
} from "../scripts/modules/map/markerManager.js";

import { initMarkerModal }          from "../scripts/modules/ui/modals/markerModal.js";
import { initItemDefinitionsModal } from "../scripts/modules/ui/modals/itemDefinitionsModal.js";
import { initCopyPasteManager }     from "../scripts/modules/map/copyPasteManager.js";
import { setupSidebar }             from "../scripts/modules/sidebar/sidebarManager.js";
import {
  showContextMenu,
  hideContextMenu
} from "../scripts/modules/ui/uiManager.js";
import { activateFloatingScrollbars } from "../scripts/modules/utils/scrollUtils.js";

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
    const initialItemDefs = await loadItemDefinitions(db);
    itemDefMap = Object.fromEntries(initialItemDefs.map(d => [d.id, d]));

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

    // Re-hydrate item definitions live
    subscribeItemDefinitions(db, async () => {
      const defs = await loadItemDefinitions(db);
      itemDefMap = Object.fromEntries(defs.map(d => [d.id, d]));

      allMarkers.forEach(({ markerObj, data }) => {
        if (data.predefinedItemId) {
          const def = itemDefMap[data.predefinedItemId] || {};
          const { id: _ignore, ...fields } = def;
          Object.assign(data, fields);

          markerObj.setIcon(createCustomIcon(data));
          markerObj.setPopupContent(renderPopup(data));
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

    // Modals & copy-paste
    const markerForm = initMarkerModal(db);
    initItemDefinitionsModal(db);
    const copyMgr = initCopyPasteManager(map, upsertMarker.bind(null, db));

    // Helper to create & persist
    function addMarker(data) {
      // shared create logic
      if (data.type === "Chest") {
        const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
        const fullDef = {
          ...def,
          lootPool: def.lootPool.map(id => itemDefMap[id]).filter(Boolean)
        };
        data.name       = fullDef.name;
        data.imageSmall = fullDef.iconUrl;
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
      allMarkers.push({ markerObj, data });
    }

    // Common callbacks for edit/copy/drag/delete
    const callbacks = {
      onEdit: (m, d, e) => markerForm.openEdit(m, d, e, updated => {
        m.setIcon(createCustomIcon(updated));
        m.setPopupContent(
          updated.type === "Chest"
            ? renderChestPopup(updated.chestDefFull || {})
            : renderPopup(updated)
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

    // Context menu handler
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

    document.addEventListener("click", e => {
      const cm = document.getElementById("context-menu");
      if (cm?.style.display === "block" && !cm.contains(e.target)) {
        cm.style.display = "none";
      }
    });

    document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);
  })();
}
