// @file: src/modules/ui/components/uiKit/modals/smallModal.js
// @version: 1.3 — wrap in .modal-content so form gap, field-row, extra-row, etc. all apply

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
  // root wrapper
  const root = document.createElement("div");
  root.id = id;
  root.classList.add("modal", "modal-small");       // match modal.small.css
  Object.assign(root.style, {
    position: "absolute",
    display:  "none",
    zIndex:   "10001"
  });

  // content container (so .modal-content CSS applies)
  const content = document.createElement("div");
  content.classList.add("modal-content");
  // small-modal override will size this down
  root.appendChild(content);

  // header
  const hdr = document.createElement("div");
  hdr.classList.add("modal-header");
  hdr.innerHTML = `
    <h2>${title}</h2>
    <span class="close">&times;</span>
  `;
  content.appendChild(hdr);

  // optional divider (we want the thin HR under header like other modals)
  const hr = document.createElement("hr");
  content.appendChild(hr);

  // body wrapper
  const body = document.createElement("div");
  body.classList.add("modal-body");
  bodies.forEach(el => body.appendChild(el));
  content.appendChild(body);

  // wire up the close button
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

  // make draggable if requested
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
 * Position an existing small‐modal next to the click event.
 *
 * @param {{ root: HTMLElement, show():void }} api
 * @param {MouseEvent} evt
 */
export function openSmallModalAt(api, evt) {
  const rect = api.root.querySelector(".modal-content").getBoundingClientRect();
  const x    = evt.pageX - rect.width - 8;
  const y    = evt.pageY - rect.height / 2;
  api.show(x, y);
}

// simple drag by header handle
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
    };
    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}
