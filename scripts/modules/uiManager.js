// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 3
// @file:    /scripts/modules/uiManager.js

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
 * Positions the modal relative to an event (e.g. mouse event).
 * @param {HTMLElement} modal The modal element.
 * @param {MouseEvent} event The event providing pageX and pageY.
 */
export function positionModal(modal, event) {
  // ensure it's visible so offsets can be measured
  modal.style.display = "block";
  const modalWidth = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;

  // position it near the click, with a small offset
  modal.style.left = (event.pageX - modalWidth + 10) + "px";
  modal.style.top  = (event.pageY - (modalHeight / 2)) + "px";
}

/**
 * Displays a context menu at the specified screen coordinates with the provided options.
 * Each option should be an object: { text: string, action: function }.
 * @param {number} x Horizontal position in pixels.
 * @param {number} y Vertical position in pixels.
 * @param {Array} options Array of option objects.
 */
export function showContextMenu(x, y, options) {
  let contextMenu = document.getElementById("context-menu");
  if (!contextMenu) {
    contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    document.body.appendChild(contextMenu);
  }

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

  contextMenu.innerHTML = "";
  options.forEach(opt => {
    const menuItem = document.createElement("div");
    menuItem.innerText = opt.text;
    menuItem.style.padding = "5px 10px";
    menuItem.style.cursor = "pointer";
    menuItem.style.whiteSpace = "nowrap";
    menuItem.addEventListener("click", () => {
      try { opt.action(); } catch (err) { console.error(err); }
      hideContextMenu();
    });
    contextMenu.appendChild(menuItem);
  });

  contextMenu.style.left = x + "px";
  contextMenu.style.top  = y + "px";
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

// @version: 3
