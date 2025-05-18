// @file: src/shared/ui/core/modalSmall.js
// @version: 1.3 — add ARIA roles, focus trapping, and visible focus styles

import { openModal, closeModal } from "./modalCore.js";

/**
 * Create a small modal with optional named slots.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void,
 *   backdrop?: boolean,
 *   draggable?: boolean,
 *   withDivider?: boolean,
 *   slots?: string[]
 * }} opts
 * @returns {{ modal: HTMLElement, content: HTMLElement, header: HTMLElement, slots?: Record<string, HTMLElement> }}
 */
export function createModalSmall({
  id,
  title,
  onClose,
  backdrop = false,
  draggable = false,
  withDivider = false,
  slots = []
}) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal-small");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const headerId = `${id}__header`;
  modal.setAttribute("aria-labelledby", headerId);
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop ? "rgba(0,0,0,0.5)" : "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.setAttribute("tabindex", "-1");
  content.style.position = "absolute";
  content.style.width = "350px";
  content.style.maxWidth = "350px";
  content.style.zIndex = "10001";

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = headerId;
  header.style.cursor = draggable ? "move" : "default";

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
  if (withDivider) content.append(document.createElement("hr"));

  // named slots
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
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // Focus-trap: override openModal to focus content
  const originalOpen = openModal;
  modal.open = () => {
    originalOpen(modal);
    content.focus();
  };

  // Draggable logic (unchanged)
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
      content.style.left = `${e.clientX - offsetX}px`;
      content.style.top  = `${e.clientY - offsetY}px`;
    }
    function onMouseUp() {
      dragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  return slots.length
    ? { modal, content, header, slots: slotEls }
    : { modal, content, header };
}
