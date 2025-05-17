// @file:    src\shared\ui\context-menu\showContextMenu.js
// @version: 1

import { hideContextMenu } from "./hideContextMenu.js";

/**
 * Displays a context menu at the specified screen coordinates
 * with the provided options.
 */
export function showContextMenu(x, y, options) {
  let contextMenu = document.getElementById("context-menu");
  if (!contextMenu) {
    contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    document.body.appendChild(contextMenu);
  }

  Object.assign(contextMenu.style, {
    position:  "absolute",
    background: "#333",
    color:      "#eee",
    border:     "1px solid #555",
    padding:    "5px",
    boxShadow:  "0px 2px 6px rgba(0,0,0,0.5)",
    display:    "block",
    zIndex:     2000,
  });

  contextMenu.innerHTML = "";
  options.forEach(opt => {
    const menuItem = document.createElement("div");
    menuItem.innerText = opt.text;
    menuItem.style.padding = "5px 10px";
    menuItem.style.cursor = "pointer";
    menuItem.style.whiteSpace = "nowrap";

    menuItem.addEventListener("click", () => {
      try { opt.action(); }
      catch (err) { console.error("Context-menu action error:", err); }
      hideContextMenu();
    });

    contextMenu.appendChild(menuItem);
  });

  contextMenu.style.left = x + "px";
  contextMenu.style.top  = y + "px";
}
