// @file:    src/shared/ui/managers/draggable.js
// @version: 1

/**
 * Makes an element draggable using an optional handle.
 */
export function makeDraggable(element, handle = element) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

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

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}
