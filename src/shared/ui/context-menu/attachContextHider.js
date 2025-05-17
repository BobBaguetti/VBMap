// @file:    src\shared\ui\context-menu\attachContextHider.js
// @version: 1

import { hideContextMenu } from "./hideContextMenu.js";

/**
 * Attaches a document-level click listener to hide the context menu.
 */
export function attachContextMenuHider() {
  document.addEventListener("click", () => {
    hideContextMenu();
  });
}

/**
 * Attaches a right-click listener that executes the provided action.
 */
export function attachRightClickCancel(action) {
  document.addEventListener("contextmenu", () => {
    if (typeof action === "function") action();
  });
}
