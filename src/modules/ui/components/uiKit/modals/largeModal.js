// @file: src/modules/ui/components/uiKit/modals/largeModal.js
// @version: 1.2 — exactly re-create old “size===large” branch DOM + styles

import {
  openModal,
  closeModal
} from "../modalCore.js";

/**
 * Creates a centered, backdrop-blocking “large” modal.
 *
 * @param {string} id           
 * @param {string} title        
 * @param {HTMLElement[]} bodies 
 * @param {Function} onClose    
 * @param {boolean} withDivider 
 */
export function createLargeModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  withDivider = false
) {
  // 1) Root
  const modal = document.createElement("div");
  modal.id = id;
  modal.classList.add("modal", "modal-large");
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  document.body.appendChild(modal);

  // 2) Content
  const content = document.createElement("div");
  content.classList.add("modal-content");
  Object.assign(content.style, {
    position:     "fixed",
    top:          "50%",
    left:         "50%",
    transform:    "translate(-50%,-50%)",
    maxWidth:     "550px",
    maxHeight:    "90vh",
    overflow:     "hidden",
    display:      "flex",
    flexDirection:"column"
  });
  modal.appendChild(content);

  // 3) Header
  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.innerHTML = `
    <h2>${title}</h2>
    <span class="close">&times;</span>
  `;
  content.appendChild(header);

  // 4) Divider
  if (withDivider) {
    content.appendChild(document.createElement("hr"));
  }

  // 5) Body
  const body = document.createElement("div");
  body.classList.add("modal-body");
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // 6) Close wiring
  header.querySelector(".close").onclick = () => {
    modal.style.display = "none";
    onClose();
  };
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.style.display = "none";
      onClose();
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
      onClose();
    }
  });

  return {
    modal,
    content,
    header,
    open: () => { modal.style.display = "block"; openModal(modal); },
    close: () => { modal.style.display = "none"; closeModal(modal); onClose(); }
  };
}
