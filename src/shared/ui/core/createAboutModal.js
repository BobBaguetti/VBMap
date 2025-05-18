// @file: src/shared/ui/core/createAboutModal.js
// @version: 1.0 — dedicated factory for the About dialog

import { openModal, closeModal } from "./modalCore.js";

export function createAboutModal({ id, title, onClose }) {
  // 1) Modal backdrop/container
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal--about");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${id}__header`);
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  // 2) Content box
  const content = document.createElement("div");
  content.classList.add("modal-content", "modal__body--about");
  content.setAttribute("tabindex", "-1");
  Object.assign(content.style, {
    position:     "fixed",
    top:          "50%",
    left:         "50%",
    transform:    "translate(-50%, -50%)",
    maxWidth:     "600px",
    maxHeight:    "80vh",
    overflow:     "auto",
    padding:      "1rem",
    background:   "var(--bg-30)",
    border:       "1px solid var(--border-soft)",
    borderRadius: "6px",
    boxShadow:    "var(--shadow-high)",
    zIndex:       "10001"
  });

  // 3) Header
  const header = document.createElement("header");
  header.id = `${id}__header`;
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "0.5rem";

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

  modal.append(content);
  document.body.append(modal);

  // 5) Backdrop click closes
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  // 6) Focus‐trap on open
  modal.open = () => {
    openModal(modal);
    content.focus();
  };

  return { modal, content, header, slots: { body } };
}
