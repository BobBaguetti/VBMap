// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.3 — reintroduce .modal-content wrapper

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
  // 1) Root wrapper (backdropless)
  const root = document.createElement("div");
  root.id = id;
  root.className = "modal small-modal";
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "1001"
  });

  // 2) Content wrapper (so existing CSS applies)
  const content = document.createElement("div");
  content.className = "modal-content";
  // small-modal.css already sets width on .modal.small-modal .modal-content
  root.appendChild(content);

  // 3) Header
  const hdr = document.createElement("div");
  hdr.className = "modal-header";
  hdr.innerHTML = `
    <span class="modal-title">${title}</span>
    <span class="close">&times;</span>
  `;
  content.appendChild(hdr);

  // close wiring
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

  // 4) Body
  const body = document.createElement("div");
  body.className = "modal-body";
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // 5) Optional drag on content
  if (draggable) makeSmallModalDraggable(content, hdr);

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
