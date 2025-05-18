// @file: src/shared/ui/core/createMarkerModal.js
// @version: 1.0 — dedicated factory for Marker modal

import { openModal, openModalAt, closeModal } from "./modalCore.js";

/**
 * Create a small, draggable Marker dialog.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void
 * }} opts
 * @returns {{
 *   modal: HTMLElement,
 *   content: HTMLElement,
 *   open: () => void,
 *   openAt: (evt: Event) => void,
 *   close: () => void
 * }}
 */
export function createMarkerModal({ id, title, onClose }) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--marker");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.position = "absolute";
  modal.style.zIndex = "9999";
  modal.style.background = "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.setAttribute("tabindex", "-1");
  Object.assign(content.style, {
    position: "absolute",
    width: "350px",
    maxWidth: "350px",
    zIndex: "10001"
  });

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}__header`;
  header.style.cursor = "move";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = "<span aria-hidden='true'>&times;</span>";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.onclick = () => {
    closeModal(modal);
    onClose?.();
  };

  header.append(titleEl, closeBtn);
  content.append(header);
  modal.append(content);
  document.body.append(modal);

  // Backdrop click closes
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // Draggable logic
  let dragging = false, offsetX = 0, offsetY = 0;
  header.addEventListener("mousedown", e => {
    dragging = true;
    const rect = content.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
  function onMouseMove(e) {
    if (!dragging) return;
    content.style.left = `${e.clientX - offsetX}px`;
    content.style.top = `${e.clientY - offsetY}px`;
  }
  function onMouseUp() {
    dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  return {
    modal,
    content,
    open: () => openModal(modal),
    openAt: evt => openModalAt(modal, evt),
    close: () => closeModal(modal)
  };
}
