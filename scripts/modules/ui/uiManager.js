// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 4   The current file version is 4. Increase by 1 every time you update anything.
// @file:    /scripts/modules/ui/uiManager.js

import { showContextMenu, hideContextMenu } from "./components/contextMenu.js";
import { makeDraggable }                   from "./components/draggable.js";

// Re-export makeDraggable for backward compatibility
export { makeDraggable };

/**
 * Displays a context menu at the specified screen coordinates with the provided options.
 * Each option should be an object: { text: string, action: function }.
 * @param {number} x Horizontal position in pixels.
 * @param {number} y Vertical position in pixels.
 * @param {Array} options Array of option objects.
 */
export { showContextMenu, hideContextMenu };

/**
 * Positions the modal relative to an event (e.g. mouse event).
 * @param {HTMLElement} modal The modal element.
 * @param {Event} event The event providing pageX and pageY.
 */
export function positionModal(modal, event) {
  modal.style.display = "block";
  const modalWidth  = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;
  modal.style.left = (event.pageX - modalWidth + 10) + "px";
  modal.style.top  = (event.pageY - (modalHeight / 2))  + "px";
}

/**
 * Hides the context menu when clicking elsewhere.
 */
export function attachContextMenuHider() {
  document.addEventListener("click", () => {
    hideContextMenu();
  });
}

/**
 * Attaches a document-level right-click listener that executes the provided action.
 * @param {Function} action The function to execute on right click.
 */
export function attachRightClickCancel(action) {
  document.addEventListener("contextmenu", () => {
    if (typeof action === "function") {
      action();
    }
  });
}
