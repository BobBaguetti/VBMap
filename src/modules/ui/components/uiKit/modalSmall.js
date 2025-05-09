// @file: src/modules/ui/components/uiKit/modalSmall.js
// @version: 1.0 — small, draggable-capable modal creator

import { openModal, closeModal } from "./modalCore.js";

/**
 * Create a small modal.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void,
 *   backdrop?: boolean,
 *   draggable?: boolean,
 *   withDivider?: boolean
 * }} opts
 * @returns {{ modal: HTMLElement, content: HTMLElement, header: HTMLElement }}
 */
export function createModalSmall({
  id,
  title,
  onClose,
  backdrop = true,
  draggable = false,
  withDivider = false
}) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal-small");
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop
    ? "rgba(0,0,0,0.5)"
    : "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.style.position = "absolute";
  content.style.width = "350px";
  content.style.maxWidth = "350px";
  content.style.zIndex = "10001";

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}-handle`;
  header.style.cursor = draggable ? "move" : "default";

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

  // Draggable logic for small modals
  if (draggable) {
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener("mousedown", e => {
      dragging = true;
      const { left, top } = content.getBoundingClientRect();
      offsetX = e.clientX - left;
      offsetY = e.clientY - top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
      if (!dragging) return;
      content.style.position = "absolute";
      content.style.left = `${e.clientX - offsetX}px`;
      content.style.top = `${e.clientY - offsetY}px`;
    }
    function onMouseUp() {
      dragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  return { modal, content, header };
}
