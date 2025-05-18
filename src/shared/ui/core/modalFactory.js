// @file: src/shared/ui/core/modalFactory.js
// @version: 1.4 — correct per-modal class derivation (strip “-modal” suffix)

import { openModal, closeModal, openModalAt } from "./modalCore.js";

/**
 * Factory for creating any modal. Uses your per-modal CSS for sizing/layout.
 *
 * @param {Object} opts
 * @param {string} opts.id           — DOM id for the <div.modal>
 * @param {string} opts.title        — text for the header <h2>
 * @param {() => void} [opts.onClose]
 * @param {boolean} [opts.backdrop]  — whether to show backdrop (default: true)
 * @param {boolean} [opts.withDivider] — whether to insert an <hr> under the header
 * @param {string[]} [opts.slots]    — names of additional content regions
 * @returns {{
 *   modal: HTMLElement,
 *   content: HTMLElement,
 *   header: HTMLElement,
 *   slots?: Record<string, HTMLElement>
 * }}
 */
export function createModal({
  id,
  title,
  onClose,
  backdrop = true,
  withDivider = false,
  slots = []
}) {
  // Root modal container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal");

  // Derive per-modal class by stripping the literal "-modal" suffix (case-insensitive)
  const baseName = id.replace(/-modal$/i, "");
  modal.classList.add(`modal--${baseName.toLowerCase()}`);

  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop ? "rgba(0,0,0,0.5)" : "transparent";

  // Content wrapper
  const content = document.createElement("div");
  content.classList.add("modal-content");

  // Header
  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}-handle`;
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => {
    closeModal(modal);
    onClose?.();
  };
  header.append(titleEl, closeBtn);
  content.append(header);

  if (withDivider) {
    content.append(document.createElement("hr"));
  }

  // Named slots
  const slotEls = {};
  for (const name of slots) {
    const slotEl = document.createElement("div");
    slotEl.classList.add("modal-slot", `modal-slot--${name}`);
    content.append(slotEl);
    slotEls[name] = slotEl;
  }

  modal.append(content);
  document.body.append(modal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  return slots.length
    ? { modal, content, header, slots: slotEls }
    : { modal, content, header };
}

export { openModal, closeModal, openModalAt };
