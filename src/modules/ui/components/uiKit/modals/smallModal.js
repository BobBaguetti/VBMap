// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.2 — enforce field-row & flex+gap, extra-row support

import { openModal, closeModal } from "../modalCore.js";

/**
 * Create a small, floating modal (no backdrop) that you can position yourself.
 *
 * @param {string} id            Unique ID for the modal root
 * @param {string} title         Header text
 * @param {{label:HTMLElement, body:HTMLElement}[]} rows
 *            Array of objects describing each row: you must wrap label+control
 *            in .field-row. For “extra” rows, set row.isExtra = true.
 * @param {Function} onClose     Callback when the user clicks × or presses Escape
 * @param {boolean} draggable    Whether the modal can be dragged by its header
 */
export function createSmallModal(
  id,
  title,
  rows = [],
  onClose = () => {},
  draggable = false
) {
  // Root wrapper
  const root = document.createElement("div");
  root.id = id;
  root.className = "modal modal-small";  // modal.small.css :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "1001"
  });

  // Header
  const hdr = document.createElement("div");
  hdr.className = "modal-header";
  hdr.innerHTML = `
    <h2>${title}</h2>
    <button class="modal-close-btn">×</button>
  `;
  root.appendChild(hdr);

  // Body container: flex+gap just like base modals do (#edit-form) :contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}
  const body = document.createElement("div");
  body.style.display        = "flex";
  body.style.flexDirection  = "column";
  body.style.gap            = "8px";
  rows.forEach(({ label, control, isExtra }) => {
    const row = document.createElement("div");
    row.className = "field-row" + (isExtra ? " extra-row" : "");
    // label is assumed to be a <label>
    row.appendChild(label);
    // control can be a <select>, <input>, or a block (like extra-info)
    row.appendChild(control);
    body.appendChild(row);
  });
  root.appendChild(body);

  // Close wiring
  hdr.querySelector(".modal-close-btn")
     .addEventListener("click", () => {
       onClose();
       hide();
     });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && root.style.display === "block") {
      onClose();
      hide();
    }
  });

  // Optional dragging
  if (draggable) {
    makeSmallModalDraggable(root, hdr);
  }

  document.body.appendChild(root);

  function show(x = 0, y = 0) {
    root.style.left    = `${x}px`;
    root.style.top     = `${y}px`;
    root.style.display = "block";
  }
  function hide() {
    root.style.display = "none";
  }

  return { root, show, hide };
}

function makeSmallModalDraggable(modalEl, handle) {
  let dragging = false, offsetX = 0, offsetY = 0;
  handle.onmousedown = e => {
    dragging = true;
    offsetX  = e.clientX - modalEl.offsetLeft;
    offsetY  = e.clientY - modalEl.offsetTop;
    document.onmousemove = ev => {
      if (!dragging) return;
      modalEl.style.left     = `${ev.clientX - offsetX}px`;
      modalEl.style.top      = `${ev.clientY - offsetY}px`;
    };
    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}

/**
 * Position an existing small‐modal next to a click event.
 */
export function openSmallModalAt(modalApi, evt) {
  const rect = modalApi.root.getBoundingClientRect();
  modalApi.show(
    evt.pageX - rect.width - 8,
    evt.pageY - rect.height / 2
  );
}
