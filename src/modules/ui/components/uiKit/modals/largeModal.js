// @file: src/modules/ui/components/uiKit/modals/largeModal.js
// @version: 1.1 — wrap bodies in .modal-body and insert divider, preserving old visual structure

import {
  createModal,
  openModal,
  closeModal
} from "../modalCore.js";

/**
 * Creates a centered, backdrop-blocking “large” modal.
 *
 * @param {string} id            Unique ID for the modal root
 * @param {string} title         Header text
 * @param {HTMLElement[]} bodies Array of DOM nodes to append into the modal body
 * @param {Function} onClose     Callback when the user clicks ×, clicks backdrop, or presses Escape
 * @param {boolean} withDivider  Whether to insert an <hr> under the header
 */
export function createLargeModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  withDivider = false
) {
  // 1) Build the bare‐bones modal (no sizing/backdrop)
  const { modal, content, header } = createModal({ id, title });

  // 2) Add our large‐mode classes & backdrop
  modal.classList.add("modal-large");
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 3) Size & center .modal-content (same as old modal-large.css)
  Object.assign(content.style, {
    position:    "fixed",
    top:         "50%",
    left:        "50%",
    transform:   "translate(-50%,-50%)",
    maxWidth:    "550px",
    maxHeight:   "90vh",
    overflow:    "hidden",
    display:     "flex",
    flexDirection:"column"
  });

  // 4) Optional divider under header
  if (withDivider) {
    content.appendChild(document.createElement("hr"));
  }

  // 5) Wrap all bodies into a scrollable .modal-body
  const body = document.createElement("div");
  body.classList.add("modal-body");  // modal.large.css gives this padding & flex:1 :contentReference[oaicite:0]{index=0}
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // 6) Wire close to onClose callback
  //    (the createModal core already wires backdrop click + ESC to closeModal)
  const origClose = closeModal;
  function closeAndCallback() {
    origClose(modal);
    onClose();
  }

  // 7) Return the API
  return {
    modal,
    content,
    header,
    open: () => openModal(modal),
    close: closeAndCallback
  };
}
