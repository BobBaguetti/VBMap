// @file: src/bootstrap/contextMenu.js
// @version: 1.3 — updated shared UI import paths

import { showContextMenu, hideContextMenu } from "../shared/ui/context-menu/index.js"

/**
 * Initialize context menu behavior.
 * @param {L.Map} map       – Leaflet map instance
 * @param {Firestore} db    – Firestore instance for CRUD
 * @param {boolean} isAdmin – Whether current user is admin
 */
function init(map, db, isAdmin) {
  // 1) Show “Create New Marker” on right-click (admin only)
  map.on("contextmenu", evt => {
    if (!isAdmin) return;
    showContextMenu(
      evt.originalEvent.pageX,
      evt.originalEvent.pageY,
      [{
        text: "Create New Marker",
        action: () =>
          import("./modalsManager.js").then(({ default: modals }) => {
            modals.init(db, map).markerForm.openCreate(
              [evt.latlng.lat, evt.latlng.lng],
              undefined,
              evt.originalEvent,
              (data) => import("../modules/services/firebaseService.js")
                .then(m => m.upsertMarker(db, data))
            );
          })
      }]
    );
  });

  // 2) Hide on any outside click
  document.addEventListener("click", e => {
    const cm = document.getElementById("context-menu");
    if (cm?.style.display === "block" && !cm.contains(e.target)) {
      hideContextMenu();
    }
  });
}

export default {
  init
};
