// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.5 — fix CSS class names to match existing styles

/**
 * Create a small, floating modal (no backdrop) that you can position yourself.
 *
 * @param {string} id              Unique ID for the modal root
 * @param {string} title           Header text
 * @param {HTMLElement[]} bodies   Array of DOM nodes to append into the body
 * @param {Function} onClose       Callback when the user clicks × or presses Escape
 * @param {boolean} draggable      Whether the modal can be dragged by its header
 * @param {boolean} withDivider    Whether to insert an <hr> under the header
 * @returns {{ root: HTMLElement, show(x:number,y:number):void, hide():void }}
 */
export function createSmallModal(
  id,
  title,
  bodies = [],
  onClose = () => {},
  draggable = false,
  withDivider = false
) {
  // 1) Root wrapper
  const root = document.createElement("div");
  root.id = id;
  // Use the exact classes your CSS expects:
  root.classList.add("modal", "modal-small");
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "1001"
  });

  // 2) Content wrapper
  const content = document.createElement("div");
  content.className = "modal-content";
  Object.assign(content.style, {
    maxHeight: "90vh",
    overflowY: "auto"
  });
  root.appendChild(content);

  // 3) Header
  const hdr = document.createElement("div");
  hdr.className = "modal-header";
  hdr.innerHTML = `
    <span class="modal-title">${title}</span>
    <span class="close">&times;</span>
  `;
  content.appendChild(hdr);

  // 4) Optional divider
  if (withDivider) {
    const hr = document.createElement("hr");
    content.appendChild(hr);
  }

  // 5) Body
  const body = document.createElement("div");
  body.className = "modal-body";
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // 6) Close wiring
  hdr.querySelector(".close").onclick = () => {
    onClose();
    hide();
  };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && root.style.display === "block") {
      onClose();
      hide();
    }
  });

  // 7) Drag if requested
  if (draggable) {
    makeSmallModalDraggable(content, hdr);
  }

  document.body.append(root);

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
  const rect = modalApi.root
    .querySelector(".modal-content")
    .getBoundingClientRect();
  modalApi.show(evt.pageX - rect.width - 8, evt.pageY - rect.height / 2);
}

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
