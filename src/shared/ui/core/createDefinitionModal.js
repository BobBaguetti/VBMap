// @file: src/shared/ui/core/createDefinitionModal.js
// @version: 1.2 — remove hard-coded maxWidth to defer to CSS

import { openModal, closeModal } from "./modalCore.js";

export function createDefinitionModal({ id, title, onClose }) {
  // 1) Modal backdrop/container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--definition");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 2) Content pane: header + body
  const content = document.createElement("div");
  content.classList.add("modal-content");
  Object.assign(content.style, {
    position:      "fixed",
    top:           "50%",
    left:          "50%",
    transform:     "translate(-50%, -50%)",
    /* maxWidth now controlled via CSS */
    maxHeight:     "90vh",
    display:       "flex",
    flexDirection: "column",
    overflow:      "hidden",
    zIndex:        "10001"
  });

  // 3) Header
  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}__header`;
  Object.assign(header.style, {
    display:       "flex",
    alignItems:    "center",
    justifyContent:"space-between",
    padding:       "0.75rem 1rem",
    borderBottom:  "1px solid var(--border-soft)"
  });
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

  // 4) Body row
  const body = document.createElement("div");
  body.classList.add("modal-body");
  Object.assign(body.style, {
    display:   "flex",
    flex:      "1 1 auto",
    overflow:  "hidden"
  });

  // 5) Named slots
  const left = document.createElement("div");
  left.classList.add("modal-slot", "modal-slot--left");
  left.id = "definition-left-pane";
  Object.assign(left.style, {
    flex:        "0 0 300px",
    overflowY:   "auto",
    borderRight: "1px solid var(--border-soft)"
  });

  const preview = document.createElement("div");
  preview.classList.add("modal-slot", "modal-slot--preview");
  preview.id = "definition-preview-container";
  Object.assign(preview.style, {
    flex:     "1 1 auto",
    overflow: "auto",
    position: "relative"
  });

  // 6) Assemble
  body.append(left, preview);
  content.append(header, body);
  modal.append(content);
  document.body.append(modal);

  // 7) Backdrop click closes
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // 8) Open helper
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
