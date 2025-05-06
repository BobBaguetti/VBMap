// @file: /scripts/modules/ui/components/draggable.js
// @version: 1.0 – Makes an element draggable via an optional handle

/**
 * Makes an element draggable using an optional handle.
 * @param {HTMLElement} element The element to be dragged.
 * @param {HTMLElement} handle Optional element to use as the drag handle.
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
  
    const onMouseMove = e => {
      if (isDragging) {
        element.style.left = (e.clientX - offsetX) + "px";
        element.style.top  = (e.clientY - offsetY) + "px";
      }
    };
    const onMouseUp = () => { isDragging = false; };
  
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  }
  