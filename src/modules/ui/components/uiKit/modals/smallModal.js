// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.2 — fully standalone small-modal helper

/**
 * Create a small, floating modal (no backdrop) that you can position yourself.
 *
 * @param {string} id            Unique ID for the modal root
 * @param {string} title         Header text
 * @param {HTMLElement[]} bodies Array of DOM nodes to append into the body
 * @param {Function} onClose     Callback when the user clicks × or presses Escape
 * @param {boolean} draggable    Whether the modal can be dragged by its header
 * @returns {{ root: HTMLElement, show(x:number,y:number):void, hide():void }}
 */
export function createSmallModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  draggable = false
) {
  // Root wrapper
  const root = document.createElement("div");
  root.id = id;
  root.className = "modal small-modal";  // styled via modal.small.css
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "1001"
  });

  // Header
  const hdr = document.createElement("div");
  hdr.className = "modal-header";
  hdr.innerHTML = `
    <span class="modal-title">${title}</span>
    <button class="modal-close-btn">×</button>
  `;
  root.appendChild(hdr);

  // Body
  const body = document.createElement("div");
  body.className = "modal-body";
  bodies.forEach(el => body.appendChild(el));
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

/**
 * Position an existing small‐modal next to a click event.
 *
 * @param {{ root: HTMLElement, show():void }} modalApi
 * @param {MouseEvent} evt
 */
export function openSmallModalAt(modalApi, evt) {
  const rect = modalApi.root.getBoundingClientRect();
  const x    = evt.pageX - rect.width - 8;
  const y    = evt.pageY - rect.height / 2;
  modalApi.show(x, y);
}

/**
 * Make a small-modal draggable via its header.
 *
 * @param {HTMLElement} modalEl
 * @param {HTMLElement} handle
 */
function makeSmallModalDraggable(modalEl, handle) {
  let dragging = false, offsetX = 0, offsetY = 0;

  handle.onmousedown = e => {
    dragging = true;
    offsetX  = e.clientX - modalEl.offsetLeft;
    offsetY  = e.clientY - modalEl.offsetTop;

    document.onmousemove = e2 => {
      if (!dragging) return;
      modalEl.style.left     = `${e2.clientX - offsetX}px`;
      modalEl.style.top      = `${e2.clientY - offsetY}px`;
      modalEl.style.position = "absolute";
    };

    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}
