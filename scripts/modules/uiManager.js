// @fullfile: Send the entire file, no omissions or abridgment — version is 2. Increase by 1 every time you update anything.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 2
// @file:    /scripts/modules/uiManager.js

import { ContextMenu } from './ui/uiKit.js';

/**
 * Makes an element draggable using an optional handle.
 * @param {HTMLElement} element The element to be dragged.
 * @param {HTMLElement} [handle=element] Optional element to use as the drag handle.
 */
export function makeDraggable(element, handle = element) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener('mousedown', e => {
    isDragging = true;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    element.style.position = 'absolute';
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
  }
}

/**
 * Positions a modal element relative to an event.
 * @param {HTMLElement} modal The modal element.
 * @param {MouseEvent} event The mouse event providing pageX and pageY.
 */
export function positionModal(modal, event) {
  modal.style.display = 'block';
  const modalWidth = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;
  modal.style.left = `${event.pageX - modalWidth + 10}px`;
  modal.style.top = `${event.pageY - modalHeight / 2}px`;
}

/**
 * Displays a context menu at the specified coordinates.
 * @param {number} x The x-coordinate (in pixels).
 * @param {number} y The y-coordinate (in pixels).
 * @param {Array<{label: string, action: Function}>} items The menu items.
 */
export function showContextMenu(x, y, items) {
  new ContextMenu(items).showAt({ x, y });
}

/**
 * Hides any existing context menu.
 */
export function hideContextMenu() {
  ContextMenu.removeExisting();
}

// @deprecated: Direct use of attachContextMenuHider is no longer needed; use ContextMenu class for click-off handling.
// export function attachContextMenuHider() {}
// export function attachRightClickCancel(action) {}

// @version: 2
