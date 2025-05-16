// @file: src/modules/initializer/contextMenuHandler.js
// @version: 1.0 — centralizes context‐menu setup and teardown

import { map } from "../appInit.js";
import { showContextMenu, hideContextMenu } from "../modules/ui/uiManager.js";

/**
 * Initialize context‐menu behavior for marker creation and outside‐click hiding.
 *
 * @param {boolean} isAdmin            – whether the user is an admin
 * @param {object}  markerForm         – the marker modal instance with openCreate()
 * @param {Function} upsertMarkerFn    – function to call to save a new marker
 */
export function initContextMenu(isAdmin, markerForm, upsertMarkerFn) {
  // Right‐click on map to open “Create New Marker” action
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
          upsertMarkerFn
        )
      }]
    );
  });

  // Click outside the menu hides it
  document.addEventListener("click", e => {
    const cm = document.getElementById("context-menu");
    if (cm?.style.display === "block" && !cm.contains(e.target)) {
      hideContextMenu();
    }
  });
}
