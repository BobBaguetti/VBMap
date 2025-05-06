// @version: 1.2
// @file: /scripts/modules/ui/components/modalHelpers.js

import { createFieldRow, createDropdownField, createFormButtonRow } from "./fieldBuilders.js";

/**
 * Create a modal wrapper.
 * @param {{id:string,title:string,backdrop?:boolean,withDivider?:boolean,draggable?:boolean,size?:string,onClose?:Function}} options
 */
export function createModal({
  id,
  title,
  backdrop = true,
  withDivider = false,
  draggable = false,
  size = "small",
  onClose
}) {
  const modal = document.createElement("div");
  modal.className = `modal modal-${size}`;
  modal.id = id;
  modal.style.backgroundColor = backdrop ? "rgba(0,0,0,0.5)" : "transparent";
  modal.style.zIndex = "9999";
  modal.style.display = "none";

  const content = document.createElement("div");
  content.className = "modal-content";
  content.style.zIndex = "10000";
  if (size === "large") {
    Object.assign(content.style, {
      position:      "fixed",
      top:           "50%",
      left:          "50%",
      transform:     "translate(-50%,-50%)",
      maxWidth:      "550px",
      maxHeight:     "90vh",
      overflow:      "hidden",
      display:       "flex",
      flexDirection: "column"
    });
  } else {
    Object.assign(content.style, {
      position:   "absolute",
      width:      "350px",
      maxWidth:   "350px"
    });
  }

  const header = document.createElement("div");
  header.className = "modal-header";
  header.id = `${id}-handle`;
  header.style.cursor = draggable ? "move" : "default";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
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

  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      onClose?.();
    }
  });

  if (draggable && size !== "large") {
    let dragging = false, ox = 0, oy = 0;
    header.onmousedown = e => {
      dragging = true;
      const rect = content.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      document.onmousemove = m => {
        if (!dragging) return;
        Object.assign(content.style, {
          left:     `${m.clientX - ox}px`,
          top:      `${m.clientY - oy}px`,
          position: "absolute"
        });
      };
      document.onmouseup = () => {
        dragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  return { modal, header, content };
}

/**
 * Show the modal.
 */
export function openModal(modal) {
  modal.style.display = "block";
}

/**
 * Hide the modal.
 */
export function closeModal(modal) {
  modal.style.display = "none";
}

/**
 * Position & show the modal at event coordinates.
 */
export function openModalAt(modal, evt) {
  openModal(modal);
  const content = modal.querySelector(".modal-content");
  const { width, height } = content.getBoundingClientRect();
  Object.assign(content.style, {
    left:     `${evt.pageX - width}px`,
    top:      `${evt.pageY - height / 2}px`,
    position: "absolute"
  });
}

export { createDropdownField, createFormButtonRow };
