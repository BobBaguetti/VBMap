// @file: /scripts/modules/ui/components/modalCore.js
// @version: 2.2 – backdrop-click & ESC fixes
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

export function createModalCore({
  id,
  ariaLabel,
  size = "small",
  backdrop = true,
  onClose,
}) {
  // === DOM STRUCTURE ===
  const modal = document.createElement("div");
  modal.className = `modal modal-${size}`;
  modal.id = id;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  if (ariaLabel) modal.setAttribute("aria-label", ariaLabel);
  Object.assign(modal.style, {
    display: backdrop ? "none" : "none",
    backgroundColor: backdrop ? "rgba(0,0,0,0.5)" : "transparent",
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: 9999,
  });
  modal.tabIndex = -1;

  const content = document.createElement("div");
  content.className = "modal-content";
  Object.assign(content.style, size === "large"
    ? {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "600px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "360px",
        maxWidth: "95%",
      });

  // Prevent clicks inside content from bubbling to modal
  content.addEventListener("click", e => e.stopPropagation());

  // Header placeholder
  const header = document.createElement("div");
  header.className = "modal-header";

  content.appendChild(header);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // === EVENTS ===
  function onBackdropClick() {
    close();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
    else if (e.key === "Tab") trapFocus(e);
  }

  function trapFocus(e) {
    const focusable = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // === OPEN / CLOSE ===
  let lastFocused = null;
  function open() {
    lastFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    // show
    modal.style.display = "block";

    // wire events
    modal.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);

    // focus into modal
    setTimeout(() => {
      const target = content.querySelector("input, button, [tabindex]") || content;
      target.focus();
    }, 0);
  }

  function close() {
    modal.style.display = "none";

    // cleanup events
    modal.removeEventListener("click", onBackdropClick);
    document.removeEventListener("keydown", onKeydown);

    document.body.style.overflow = "";
    lastFocused?.focus?.();
    onClose?.();
  }

  function openAt(x, y) {
    open();
    Object.assign(content.style, {
      top: `${y}px`,
      left: `${x}px`,
      transform: `translate(0, 0)`,
    });
  }

  return { modal, header, content, open, close, openAt };
}
