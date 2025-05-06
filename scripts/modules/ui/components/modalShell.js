// @file: /scripts/modules/ui/components/modalShell.js
// @version: 1.0 – modal creation, open/close, lifecycle

let _attached = new WeakSet();

function attachLifecycle(modal) {
  if (_attached.has(modal)) return;
  _attached.add(modal);
  const prevFocus = document.activeElement;
  const scrollY   = window.scrollY;
  document.documentElement.style.overflow = "hidden";
  modal.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    prevFocus?.focus?.();
  }, { once: true });
}

/**
 * Create a modal container with header + close button and (optional) divider.
 */
export function createModal({ id, title, size="small", backdrop=true, draggable=false, withDivider=false, onClose }) {
  const modal = document.createElement("div");
  modal.className = `modal modal-${size}`;
  modal.id = id;
  modal.style.zIndex = "9999";
  modal.style.backgroundColor = backdrop ? "rgba(0,0,0,0.5)" : "transparent";

  const content = document.createElement("div");
  content.className = "modal-content";
  content.style.zIndex = "10001";
  if (size==="large") {
    Object.assign(content.style, {
      position: "fixed",
      top: "50%", left: "50%",
      transform: "translate(-50%,-50%)",
      maxWidth: "550px", maxHeight: "90vh",
      display:"flex", flexDirection:"column",
      overflow:"hidden"
    });
  } else {
    Object.assign(content.style, {
      position:"absolute",
      width:"350px"
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

  // backdrop click closes
  modal.onclick = e => {
    if (e.target===modal) {
      closeModal(modal);
      onClose?.();
    }
  };

  // draggable
  if (draggable && size!=="large") {
    let dragging=false, dx=0, dy=0;
    header.onmousedown = e => {
      dragging = true; dx=e.clientX-content.offsetLeft; dy=e.clientY-content.offsetTop;
      document.onmousemove = m=> {
        if (!dragging) return;
        content.style.left = `${m.clientX-dx}px`;
        content.style.top  = `${m.clientY-dy}px`;
        content.style.position = "absolute";
      };
      document.onmouseup = () => { dragging=false; document.onmousemove=null; };
    };
  }

  return { modal, content, header };
}

export function openModal(modal) {
  modal.style.display = "block";
  modal.style.zIndex = "9999";
  attachLifecycle(modal);
}

export function closeModal(modal) {
  modal.style.display = "none";
  modal.dispatchEvent(new Event("close"));
}
