// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/ui/uiManager.js

/**
 * Makes an element draggable using an optional handle.
 * @param {HTMLElement} element The element to be dragged.
 * @param {HTMLElement} handle Optional element to use as the drag handle.
 */
export function makeDraggable(element, handle = element) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (e) => {
    isDragging = true;
    const style = window.getComputedStyle(element);
    offsetX = e.clientX - parseInt(style.left, 10);
    offsetY = e.clientY - parseInt(style.top, 10);
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      element.style.left = (e.clientX - offsetX) + "px";
      element.style.top = (e.clientY - offsetY) + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

/**
 * Displays a context menu at the specified screen coordinates with the provided options.
 * Each option should be an object: { text: string, action: function }.
 * @param {number} x Horizontal position in pixels.
 * @param {number} y Vertical position in pixels.
 * @param {Array} options Array of option objects.
 */
export function showContextMenu(x, y, options) {
  // Look for an existing context menu element; create one if missing.
  let contextMenu = document.getElementById("context-menu");
  if (!contextMenu) {
    contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    document.body.appendChild(contextMenu);
  }

  // Apply styles
  Object.assign(contextMenu.style, {
    position: "absolute",
    background: "#333",
    color: "#eee",
    border: "1px solid #555",
    padding: "5px",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.5)",
    display: "block",
    zIndex: 2000,
  });

  // Clear any existing content and add new options
  contextMenu.innerHTML = "";
  options.forEach(opt => {
    const menuItem = document.createElement("div");
    menuItem.innerText = opt.text;
    menuItem.style.padding = "5px 10px";
    menuItem.style.cursor = "pointer";
    menuItem.style.whiteSpace = "nowrap";
    menuItem.addEventListener("click", () => {
      try {
        opt.action();
      } catch (err) {
        console.error("Error executing context menu action:", err);
      }
      hideContextMenu();
    });
    contextMenu.appendChild(menuItem);
  });

  // Position the menu
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
}

/**
 * Hides the context menu if it exists.
 */
export function hideContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}

/**
 * Positions the modal relative to an event (e.g. mouse event).
 * @param {HTMLElement} modal The modal element.
 * @param {Event} event The event providing pageX and pageY.
 */
export function positionModal(modal, event) {
  modal.style.display = "block";
  const modalWidth = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;
  modal.style.left = (event.pageX - modalWidth + 10) + "px";
  modal.style.top = (event.pageY - (modalHeight / 2)) + "px";
}

/**
 * Attaches a document-level click listener to hide the context menu.
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

// @version: 1