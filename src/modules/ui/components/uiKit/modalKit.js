// @file: src/modules/ui/components/uiKit/modalKit.js
// @version: 1.0 — modal lifecycle & helpers

function attachModalLifecycle(modal) {
    const prevFocused = document.activeElement;
    const scrollY     = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    function restore() {
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollY);
      prevFocused?.focus?.();
    }
    modal.dataset.lifecycleAttached = "true";
    modal.addEventListener("close", restore, { once: true });
  }
  
  export function createModal({
    id, title, onClose,
    size = "small", backdrop = true,
    draggable = false, withDivider = false
  }) {
    const modal = document.createElement("div");
    modal.id = id;
    modal.classList.add("modal", `modal-${size}`);
    modal.style.zIndex = "9999";
    modal.style.backgroundColor = backdrop
      ? "rgba(0,0,0,0.5)"
      : "transparent";
  
    const content = document.createElement("div");
    content.classList.add("modal-content");
    content.style.zIndex = "10001";
    if (size === "large") {
      Object.assign(content.style, {
        position:    "fixed",
        top:         "50%",
        left:        "50%",
        transform:   "translate(-50%,-50%)",
        maxWidth:    "550px",
        maxHeight:   "90vh",
        overflow:    "hidden",
        display:     "flex",
        flexDirection:"column"
      });
    } else {
      Object.assign(content.style, {
        position: "absolute",
        width:    "350px",
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
      makeModalDraggable(content, header);
    }
  
    return { modal, content, header };
  }
  
  function makeModalDraggable(modalEl, handle) {
    let dragging = false, offsetX = 0, offsetY = 0;
    handle.onmousedown = e => {
      dragging = true;
      offsetX = e.clientX - modalEl.offsetLeft;
      offsetY = e.clientY - modalEl.offsetTop;
      document.onmousemove = e2 => {
        if (!dragging) return;
        modalEl.style.left = `${e2.clientX - offsetX}px`;
        modalEl.style.top  = `${e2.clientY - offsetY}px`;
        modalEl.style.position = "absolute";
      };
      document.onmouseup = () => {
        dragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }
  
  export function openModal(modal) {
    modal.style.display = "block";
    modal.style.zIndex  = "9999";
    if (!modal.dataset.lifecycleAttached) {
      attachModalLifecycle(modal);
    }
  }
  
  export function closeModal(modal) {
    modal.style.display = "none";
    modal.style.zIndex  = "-1";
    modal.dispatchEvent(new Event("close"));
  }
  
  export function openModalAt(modal, evt) {
    openModal(modal);
    const content = modal.querySelector(".modal-content");
    const rect    = content.getBoundingClientRect();
    content.style.left = `${evt.clientX - rect.width}px`;
    content.style.top  = `${evt.clientY - rect.height/2}px`;
  }
  