// @file: /scripts/modules/map/chestController.js
// @version: 1.2 – pass isAdmin, add edit/delete in contextmenu

import { subscribeChestTypes }      from "../services/chestTypesService.js";
import { subscribeChests, updateChest, deleteChest } from "../services/chestsService.js";
import { initChestInstanceModal }   from "../ui/modals/chestInstanceModal.js";
import { createChestMarker }        from "./chestManager.js";

/**
 * Initialize the Chest layer: load types & instances,
 * render markers, and wire up admin context‐menus.
 */
export function initChestLayer(db, map, layers, showContextMenu) {
  let chestTypeMap = {};
  const chestMarkers = {};
  const isAdmin = document.body.classList.contains("is-admin");

  // 1) Keep chest-type definitions up to date
  subscribeChestTypes(db, types => {
    chestTypeMap = Object.fromEntries(types.map(t => [t.id, t]));
    // Refresh all existing popups if the definition changed
    Object.values(chestMarkers).forEach(marker => {
      const data = marker.__chestData;
      const def  = chestTypeMap[data.chestTypeId];
      if (def) marker.setPopupContent(def && buildChestPopupHTML(def));
    });
  });

  // 2) Subscribe chest instances
  subscribeChests(db, chests => {
    const newIds = new Set(chests.map(c => c.id));

    // Remove any deleted instances
    Object.keys(chestMarkers).forEach(id => {
      if (!newIds.has(id)) {
        layers.Chest.removeLayer(chestMarkers[id]);
        delete chestMarkers[id];
      }
    });

    // Add any new instances
    chests.forEach(data => {
      if (!chestTypeMap[data.chestTypeId]) return;
      if (chestMarkers[data.id]) return;

      const marker = createChestMarker(
        data,
        chestTypeMap[data.chestTypeId],
        map,
        layers,
        showContextMenu,
        isAdmin
      );
      marker.__chestData = data;

      // Admins get an edit/delete context menu on the marker
      if (isAdmin) {
        marker.on("contextmenu", ev => {
          showContextMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, [
            {
              text: "Edit Chest…",
              action: () => {
                initChestInstanceModal(db, data.coords)
                  .open(data.coords, async ({ chestTypeId, coords }) => {
                    await updateChest(db, data.id, { chestTypeId, coords });
                  });
              }
            },
            {
              text: "Delete Chest",
              action: async () => {
                await deleteChest(db, data.id);
              }
            }
          ]);
        });
      }

      chestMarkers[data.id] = marker;
    });
  });
}

// re-export for popup refresh
import { buildChestPopupHTML } from "./chestManager.js";
