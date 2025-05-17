// @file:    src\shared\ui\core\positionModal.js
// @version: 1

/**
 * Positions a modal element relative to a mouse event.
 */
export function positionModal(modal, event) {
  modal.style.display = "block";
  const { offsetWidth: w, offsetHeight: h } = modal;
  modal.style.left = (event.pageX - w + 10) + "px";
  modal.style.top  = (event.pageY - (h / 2)) + "px";
}
