// @file: src/shared/ui/core/createListPickerModal.js
// @version: 1.0 — dedicated factory for List Picker modals

import { openModal, closeModal } from "./modalCore.js";

/**
 * Create a centered, scrollable List Picker dialog.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void
 * }} opts
 * @returns {{
 *   modal: HTMLElement,
 *   content: HTMLElement,
 *   header: HTMLElement,
 *   slots: { body: HTMLElement },
 *   open: () => void,
 *   close: () => void
 * }}
 */
export function createListPickerModal({ id, title, onClose }) {
  // 1) Backdrop/container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--list-picker");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 2) Content box
  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.setAttribute("tabindex", "-1");
  Object.assign(content.style, {
    position:    "fixed",
    top:         "50%",
    left:        "50%",
    transform:   "translate(-50%, -50%)",
    maxWidth:    "350px",
    width:       "90%",
    maxHeight:   "80vh",
    overflow:    "auto",
    background:  "var(--bg-30)",
    border:      "var(--border-width-hair) solid var(--border-soft)",
    borderRadius:"var(--radius-small)",
    padding:     "var(--space-3)",
    boxShadow:   "var(--shadow-high)",
    zIndex:      "10001"
  });

  // 3) Header
  const header = document.createElement("header");
  header.id = `${id}__header`;
  header.style.display        = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems     = "center";
  header.style.marginBottom   = "var(--space-2)";

  const titleEl = document.createElement("h3");
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = `<span aria-hidden="true">&times;</span>`;
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.onclick = () => {
    closeModal(modal);
    onClose?.();
  };

  header.append(titleEl, closeBtn);
  content.append(header);

  // 4) Body slot
  const body = document.createElement("div");
  body.classList.add("modal-slot", "modal-slot--body");
  body.setAttribute("role", "document");
  content.append(body);

  // 5) Assemble
  modal.append(content);
  document.body.append(modal);

  // 6) Backdrop click closes
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // 7) Open/close helpers
  modal.open = () => {
    openModal(modal);
    content.focus();
  };
  modal.close = () => {
    closeModal(modal);
    onClose?.();
  };

  return { modal, content, header, slots: { body }, open: modal.open, close: modal.close };
}
