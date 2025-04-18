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
  let isDragging = false, offsetX = 0, offsetY = 0;
  handle.addEventListener("mousedown", e => {
    isDragging = true;
    const style = window.getComputedStyle(element);
    offsetX = e.clientX - parseInt(style.left, 10);
    offsetY = e.clientY - parseInt(style.top, 10);
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (isDragging) {
      element.style.left = (e.clientX - offsetX) + "px";
      element.style.top  = (e.clientY - offsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => { isDragging = false; });
}

/**
 * Positions an existing modal element at the click location.
 * @param {HTMLElement} modal The modal to position (must already exist in the DOM).
 * @param {MouseEvent} event The mouse event to base the position on.
 */
export function positionModal(modal, event) {
  // ensure it’s display:block so we can measure
  modal.style.display = "block";
  const w = modal.offsetWidth, h = modal.offsetHeight;
  modal.style.left = (event.pageX - w + 10) + "px";
  modal.style.top  = (event.pageY - h/2) + "px";
}

/**
 * Shows a context menu at (x,y) with given options.
 * @param {number} x
 * @param {number} y
 * @param {{text:string,action:Function}[]} options
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
    padding: "5px",
    border: "1px solid #555",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.5)",
    zIndex: 2000,
    display: "block"
  });
  menu.innerHTML = "";
  options.forEach(opt => {
    const item = document.createElement("div");
    item.innerText = opt.text;
    Object.assign(item.style, { padding: "5px 10px", cursor: "pointer" });
    item.addEventListener("click", () => {
      try { opt.action(); } catch(e){console.error(e);}
      hideContextMenu();
    });
    menu.appendChild(item);
  });
  menu.style.left = x + "px";
  menu.style.top  = y + "px";
}

/** Hides the context menu if present. */
export function hideContextMenu() {
  const menu = document.getElementById("context-menu");
  if (menu) menu.style.display = "none";
}
