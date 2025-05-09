// @file: src/modules/ui/components/uiKit/modals/largeModal.js
// @version: 1.0 — large‐modal helper wrapping createModal

import {
  createModal,
  openModal,
  closeModal
} from "../modalKit.js";

/**
 * Creates a centered, backdrop‐blocking “large” modal.
 *
 * @param {string} id            Unique ID for the modal root
 * @param {string} title         Header text
 * @param {HTMLElement[]} bodies Array of DOM nodes to append into the modal content
 * @param {Function} onClose     Callback when the user clicks ×, clicks backdrop, or presses Escape
 * @param {boolean} withDivider  Whether to insert an <hr> under the header
 * @param {boolean} draggable    (Ignored for large modals—always fixed)
 * @returns {{ modal:HTMLElement, content:HTMLElement, header:HTMLElement, open():void, close():void }}
 */
export function createLargeModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  withDivider = false
) {
  // Use the existing createModal factory, forcing size="large" and backdrop
  const { modal, content, header } = createModal({
    id,
    title,
    size:       "large",
    backdrop:   true,
    draggable:  false,
    withDivider
  });

  // Append the provided bodies into the modal-content after the header (and divider)
  bodies.forEach(el => content.appendChild(el));

  // Expose convenient open/close methods
  function open() {
    openModal(modal);
  }
  function close() {
    closeModal(modal);
    onClose();
  }

  return { modal, content, header, open, close };
}
