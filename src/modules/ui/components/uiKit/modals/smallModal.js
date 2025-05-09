// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.6 — simple bodies array + divider, content wrapper

/**
 * Create a small, floating modal (no backdrop) that you can position yourself.
 *
 * @param {string} id            Unique ID for the modal root
 * @param {string} title         Header text
 * @param {HTMLElement[]} bodies Array of DOM nodes to append into the body section
 * @param {Function} onClose     Callback when the user clicks × or presses Escape
 * @param {boolean} draggable    Whether the modal can be dragged by its header
 * @param {boolean} withDivider  Whether to insert an <hr> under the header
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
  root.classList.add("modal", "modal-small");
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "1001"
  });

  // 2) Content container
  const content = document.createElement("div");
  content.classList.add("modal-content");
  root.appendChild(content);

  // 3) Header
  const hdr = document.createElement("div");
  hdr.classList.add("modal-header");
  hdr.innerHTML = `
    <h2>${title}</h2>
    <span class="close">&times;</span>
  `;
  content.appendChild(hdr);

  // 4) Optional divider
  if (withDivider) {
    content.appendChild(document.createElement("hr"));
  }

  // 5) Body
  const body = document.createElement("div");
  body.classList.add("modal-body");
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // 6) Close wiring
  hdr.querySelector(".close").addEventListener("click", () => {
    hide();
    onClose();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && root.style.display === "block") {
      hide();
      onClose();
    }
  });

  // 7) Drag support
  if (draggable) {
    makeDraggable(root, hdr);
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
 * @param {{ root: HTMLElement, show():void }} api
 * @param {MouseEvent} evt
 */
export function openSmallModalAt(api, evt) {
  const rect = api.root.getBoundingClientRect();
  api.show(evt.pageX - rect.width - 8, evt.pageY - rect.height / 2);
}

function makeDraggable(modalEl, handle) {
  let dragging = false, offsetX = 0, offsetY = 0;
  handle.onmousedown = e => {
    dragging = true;
    offsetX  = e.clientX - modalEl.offsetLeft;
    offsetY  = e.clientY - modalEl.offsetTop;
    document.onmousemove = ev => {
      if (!dragging) return;
      modalEl.style.left     = `${ev.clientX - offsetX}px`;
      modalEl.style.top      = `${ev.clientY - offsetY}px`;
      modalEl.style.position = "absolute";
    };
    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}
