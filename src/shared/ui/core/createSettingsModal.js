// @file: src/shared/ui/core/createSettingsModal.js
// @version: 1.0 — dedicated factory for the Settings panel

import { openModal, closeModal } from "./modalCore.js";

/**
 * Create a draggable Settings panel.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void,
 *   initialOffset?: { x: number, y: number }
 * }} opts
 * @returns {{
 *   modal: HTMLElement,
 *   content: HTMLElement,
 *   header: HTMLElement,
 *   slots: { body: HTMLElement },
 *   position: (rect?: DOMRect) => void
 * }}
 */
export function createSettingsModal({
  id,
  title,
  onClose,
  initialOffset = { x: 12, y: 64 }
}) {
  // 1) Modal container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--settings");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.position = "absolute";
  modal.style.zIndex = "9999";
  modal.style.background = "transparent";

  // 2) Content box
  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.setAttribute("tabindex", "-1");
  Object.assign(content.style, {
    maxWidth:     "300px",
    background:   "var(--bg-30)",
    border:       "1px solid var(--border-soft)",
    borderRadius: "6px",
    boxShadow:    "var(--shadow-high)",
    position:     "absolute"
  });

  // 3) Header / drag handle
  const header = document.createElement("div");
  header.classList.add("modal-header", "drag-handle");
  header.id = `${id}__header`;
  header.style.cursor = "move";
  const titleEl = document.createElement("h2");
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

  // 7) Position helper
  function position(sidebarRect) {
    const { x, y } = initialOffset;
    if (sidebarRect) {
      content.style.left = `${sidebarRect.right + x}px`;
      content.style.top  = `${sidebarRect.top + y}px`;
    } else {
      content.style.left = `${x}px`;
      content.style.top  = `${y}px`;
    }
  }

  // 8) Focus-trap on open
  modal.open = () => {
    openModal(modal);
    content.focus();
  };
  modal.close = () => {
    closeModal(modal);
    onClose?.();
  };

  // 9) Draggable logic
  let dragging = false, startX, startY, startLeft, startTop;
  header.addEventListener("pointerdown", e => {
    e.preventDefault();
    dragging = true;
    const rect = content.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", onEnd);
  });
  function onDrag(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    content.style.left = `${startLeft + dx}px`;
    content.style.top  = `${startTop  + dy}px`;
  }
  function onEnd() {
    dragging = false;
    window.removeEventListener("pointermove", onDrag);
    window.removeEventListener("pointerup", onEnd);
  }

  return {
    modal,
    content,
    header,
    slots: { body },
    position
  };
}
