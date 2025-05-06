// @version: 1.0
// @file: /scripts/modules/ui/components/modalHelpers.js

import { createPickr } from "../pickrManager.js";

// ─── createModal ────────────────────────────────────────────────────────────────
export function createModal({
  id,
  title,
  onClose,
  size = "small",
  backdrop = true,
  draggable = false,
  withDivider = false
}) {
  const modal = document.createElement("div");
  modal.classList.add("modal", `modal-${size}`);
  modal.id = id;
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop ? "rgba(0, 0, 0, 0.5)" : "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.style.zIndex = "10001";

  if (size === "large") {
    Object.assign(content.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "550px",
      maxHeight: "90vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    });
  } else {
    Object.assign(content.style, {
      position: "absolute",
      transform: "none",
      width: "350px",
      maxWidth: "350px"
    });
  }

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}-handle`;
  header.style.cursor = draggable ? "move" : "default";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    closeModal(modal);
    if (onClose) onClose();
  });

  header.append(titleEl, closeBtn);
  content.appendChild(header);
  if (withDivider) content.appendChild(document.createElement("hr"));
  modal.appendChild(content);

  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(modal);
  return { modal, header, content };
}

// ─── openModal ─────────────────────────────────────────────────────────────────
export function openModal(modal) {
  modal.style.display = "block";
  modal.style.zIndex = "9999";
  requestAnimationFrame(() => {
    modal.style.backgroundColor = modal.classList.contains("modal-large")
      ? "rgba(0, 0, 0, 0.5)"
      : "transparent";
  });
}

// ─── closeModal ────────────────────────────────────────────────────────────────
export function closeModal(modal) {
  modal.style.display = "none";
  modal.style.zIndex = "-1";
}
