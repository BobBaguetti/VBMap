// @file: /scripts/modules/ui/components/modalCore.js
// @version: 1.0 – consolidated modal creation & lifecycle

// Keep track of modals we've attached lifecycle to
const _lifecycleAttached = new WeakSet();

function attachLifecycle(modal, onClose) {
  if (_lifecycleAttached.has(modal)) return;
  _lifecycleAttached.add(modal);

  const prevFocus = document.activeElement;
  const scrollY   = window.scrollY;
  document.documentElement.style.overflow = "hidden";

  function cleanup() {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    prevFocus?.focus?.();
    onClose?.();
  }

  modal.addEventListener("close", cleanup, { once: true });
  // Close on ESC
  modal.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      close();
    }
  });
}

export function createModalCore({
  id,
  title,
  size = "small",
  backdrop = true,
  withDivider = false,
  draggable = false,
  onClose
}) {
  // 1) build DOM structure
  const modal = document.createElement("div");
  modal.className = `modal modal-${size}`;
  modal.id        = id;
  modal.style.cssText = `
    display: none;
    background-color: ${backdrop ? "rgba(0,0,0,0.5)" : "transparent"};
    z-index: 9999;
  `;
  modal.tabIndex = -1;

  const content = document.createElement("div");
  content.className = "modal-content";
  content.style.zIndex = 10000;
  if (size === "large") {
    Object.assign(content.style, {
      position:      "fixed",
      top:           "50%",
      left:          "50%",
      transform:     "translate(-50%,-50%)",
      maxWidth:      "550px",
      maxHeight:     "90vh",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden"
    });
  } else {
    Object.assign(content.style, {
      position: "absolute",
      width:    "350px",
      maxWidth: "100%"
    });
  }

  const header = document.createElement("div");
  header.className = "modal-header";
  header.style.cursor = draggable ? "move" : "default";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => close();

  header.append(titleEl, closeBtn);
  content.append(header);
  if (withDivider) content.append(document.createElement("hr"));

  modal.append(content);
  document.body.append(modal);

  // 2) backdrop‐click closes
  modal.addEventListener("click", e => {
    if (e.target === modal) close();
  });

  // 3) draggable (small modals only)
  if (draggable && size !== "large") {
    let dragging = false, ox = 0, oy = 0;
    header.addEventListener("mousedown", e => {
      dragging = true;
      const rect = content.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", e => {
        dragging = false;
        document.removeEventListener("mousemove", onDrag);
      }, { once: true });
    });
    function onDrag(e) {
      if (!dragging) return;
      Object.assign(content.style, {
        position: "absolute",
        left:     `${e.clientX - ox}px`,
        top:      `${e.clientY - oy}px`
      });
    }
  }

  // 4) open/close logic
  function open() {
    modal.style.display = "block";
    modal.focus();
    attachLifecycle(modal, onClose);
  }
  function close() {
    modal.style.display = "none";
    modal.dispatchEvent(new Event("close"));
  }
  function openAt(evt) {
    open();
    const { width, height } = content.getBoundingClientRect();
    Object.assign(content.style, {
      position: "absolute",
      left:     `${evt.pageX - width}px`,
      top:      `${evt.pageY - height / 2}px`
    });
  }

  return {
    modal,
    header,
    content,
    open,
    close,
    openAt
  };
}
