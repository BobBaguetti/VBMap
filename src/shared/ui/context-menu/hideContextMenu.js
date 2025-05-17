// @file:    src/shared/ui/context-menu/index.js/hideContextMenu.js
// @version: 1

/**
 * Hides the context menu if it exists.
 */
export function hideContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}
