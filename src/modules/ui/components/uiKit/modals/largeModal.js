// @file: src/modules/ui/components/uiKit/modals/largeModal.js
// @version: 1.2 — large modal now applies its own sizing, backdrop & centering

import { createModal, openModal, closeModal } from "../modalCore.js";

/**
 * Creates a centered, backdrop‐blocking “large” modal.
 *
 * @param {string} id             Unique ID for the modal root
 * @param {string} title          Header text
 * @param {HTMLElement[]} bodies  Array of DOM nodes to append into the modal content
 * @param {Function} onClose      Callback when the user clicks ×, clicks backdrop, or presses Escape
 * @param {boolean} withDivider   Whether to insert an <hr> under the header
 * @returns {{ modal:HTMLElement, content:HTMLElement, header:HTMLElement, open():void, close():void }}
 */
export function createLargeModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  withDivider = false
) {
  // 1) Build the barebones modal
  const { modal, content, header } = createModal({ id, title, withDivider });

  // 2) Add large‐modal CSS class and backdrop
  modal.classList.add("modal-large");
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 3) Center & size the .modal-content
  Object.assign(content.style, {
    position:     "fixed",
    top:          "50%",
    left:         "50%",
    transform:    "translate(-50%,-50%)",
    maxWidth:     "550px",
    maxHeight:    "90vh",
    overflow:     "hidden",
    display:      "flex",
    flexDirection:"column",
    background:   "#fff",      // ensure content has a background
    borderRadius: "4px"
  });

  // 4) Append your bodies
  bodies.forEach(el => content.appendChild(el));

  // 5) Hook into close to call onClose
  const originalClose = closeModal;
  function close() {
    originalClose(modal);
    onClose();
  }

  // 6) Expose open & close
  return {
    modal,
    content,
    header,
    open: () => openModal(modal),
    close
  };
}
