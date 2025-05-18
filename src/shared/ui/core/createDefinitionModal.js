// @file: src/shared/ui/core/createDefinitionModal.js
// @version: 1.0 — dedicated factory for the Definition modal

import { openModal, closeModal } from "./modalCore.js";

export function createDefinitionModal({ id, title, onClose }) {
  // 1) Modal container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--definition");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 2) Content pane
  const content = document.createElement("div");
  content.classList.add("modal-content", "modal__body--definition");
  content.setAttribute("tabindex", "-1");
  Object.assign(content.style, {
    position:     "fixed",
    top:          "50%",
    left:         "50%",
    transform:    "translate(-50%, -50%)",
    maxWidth:     "550px",
    maxHeight:    "var(--modal-definition-content-height)",
    display:      "flex",
    flexDirection:"row",
    overflow:     "hidden",
    zIndex:       "10001"
  });

  // 3) Header
  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}__header`;
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

  // 4) Named slots
  const left = document.createElement("div");
  left.classList.add("modal-slot", "modal-slot--left");
  left.id = "definition-left-pane";

  const preview = document.createElement("div");
  preview.classList.add("modal-slot", "modal-slot--preview");
  preview.id = "definition-preview-container";

  // 5) Assemble and attach
  content.append(header, left, preview);
  modal.append(content);
  document.body.append(modal);

  // 6) Backdrop click = close
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // 7) Focus-trap on open
  modal.open = () => {
    openModal(modal);
    content.focus();
  };

  return {
    modal,
    content,
    header,
    slots: { left, preview }
  };
}
