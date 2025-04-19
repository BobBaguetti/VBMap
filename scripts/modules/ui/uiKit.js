// @version: 14
// @file: /scripts/modules/ui/uiKit.js

import { createPickr } from "./pickrManager.js";

export function createModal({ id, title = "", onClose, size = "small" }) {
  if (size === "small") {
    const modal = document.createElement("div");
    modal.classList.add("modal-small");
    modal.id = id;
    modal.style.display = "none";
    document.body.appendChild(modal);
    return { modal };
  }

  const modal = document.createElement("div");
  modal.classList.add("modal", "modal-large");
  modal.id = id;

  const content = document.createElement("div");
  content.classList.add("modal-content");

  if (title) {
    const header = document.createElement("div");
    header.classList.add("modal-header");
    header.id = `${id}-handle`;

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
  }

  modal.appendChild(content);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(modal);
  return { modal, content };
}

export function closeModal(modal) {
  modal.style.display = "none";
}

export function openModal(modal) {
  modal.style.display = "block";
}

export function makeModalDraggable(modal, handle) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  handle.style.cursor = "move";

  handle.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    document.onmousemove = (e) => {
      if (isDragging) {
        modal.style.left = `${e.clientX - offsetX}px`;
        modal.style.top = `${e.clientY - offsetY}px`;
        modal.style.position = "absolute";
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}