// @file: src\shared\ui\core\modalLarge.js
// @version: 1.0 — large, centered modal creator

import { openModal, closeModal } from "./modalCore.js";

/**
 * Create a large, centered modal.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void,
 *   backdrop?: boolean,
 *   withDivider?: boolean
 * }} opts
 * @returns {{ modal: HTMLElement, content: HTMLElement, header: HTMLElement }}
 */
export function createModalLarge({
  id,
  title,
  onClose,
  backdrop = true,
  withDivider = false
}) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal-large");
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop
    ? "rgba(0,0,0,0.5)"
    : "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  Object.assign(content.style, {
    position:    "fixed",
    top:         "50%",
    left:        "50%",
    transform:   "translate(-50%, -50%)",
    maxWidth:    "550px",
    maxHeight:   "90vh",
    overflow:    "hidden",
    display:     "flex",
    flexDirection:"column",
    zIndex:      "10001"
  });

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
  if (withDivider) content.append(document.createElement("hr"));
  modal.append(content);
  document.body.append(modal);

  // Close on backdrop click
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  return { modal, content, header };
}
