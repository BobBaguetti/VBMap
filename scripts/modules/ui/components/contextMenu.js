// @file: /scripts/modules/ui/components/contextMenu.js
// @version: 1.0 – extracted from uiManager.js

/**
 * Displays a context menu at (x,y) with the given options.
 * Each option is { text: string, action: () => void }.
 */
export function showContextMenu(x, y, options) {
    let menu = document.getElementById("context-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "context-menu";
      document.body.appendChild(menu);
    }
  
    Object.assign(menu.style, {
      position: "absolute",
      background: "#333",
      color: "#eee",
      border: "1px solid #555",
      padding: "5px",
      boxShadow: "0px 2px 6px rgba(0,0,0,0.5)",
      display: "block",
      zIndex: 2000,
      left: `${x}px`,
      top:  `${y}px`
    });
  
    menu.innerHTML = "";
    options.forEach(opt => {
      const item = document.createElement("div");
      item.innerText = opt.text;
      Object.assign(item.style, {
        padding: "5px 10px",
        cursor: "pointer",
        whiteSpace: "nowrap"
      });
      item.onclick = () => {
        try { opt.action(); } catch (e) { console.error(e); }
        hideContextMenu();
      };
      menu.appendChild(item);
    });
  }
  
  /**
   * Hides the context menu if it exists.
   */
  export function hideContextMenu() {
    const menu = document.getElementById("context-menu");
    if (menu) menu.style.display = "none";
  }
  