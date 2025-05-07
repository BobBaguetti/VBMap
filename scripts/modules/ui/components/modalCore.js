// @file: /scripts/modules/ui/components/modalCore.js
// @version: 2.0 – low-level modal creation, focus-trap, backdrop, open/close logic
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

// Creates a bare-bones modal container with backdrop, ESC to close, and focus trapping
export function createModalCore({
  id,
  ariaLabel,
  size = "small",          // "small" | "large"
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
  modal.style.cssText = `
    display: none;
    background-color: ${backdrop ? "rgba(0,0,0,0.5)" : "transparent"};
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 9999;
  `;
  modal.tabIndex = -1;

  const content = document.createElement("div");
  content.className = "modal-content";
  content.style.cssText = size === "large"
    ? `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      max-width: 600px; max-height: 90vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    `
    : `
      position: absolute;
      top: 20%; left: 50%;
      transform: translateX(-50%);
      width: 360px; max-width: 95%;
    `;

  // Header placeholder—consumer will append title/search/etc.
  const header = document.createElement("div");
  header.className = "modal-header";

  content.appendChild(header);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // === LIFECYCLE & FOCUS TRAP ===
  let lastFocused = null;
  function trapFocus(e) {
    const focusable = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  function attachLifecycle() {
    // prevent double-attach
    if (modal.__lifecycleAttached) return;
    modal.__lifecycleAttached = true;

    // Save scroll/active element
    lastFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    modal.addEventListener("keydown", handleKeydown);
    modal.addEventListener("click", onBackdropClick);
    modal.addEventListener("close", cleanup, { once: true });
  }

  function cleanup() {
    document.body.style.overflow = "";
    lastFocused?.focus?.();
    onClose?.();
    // unbind events
    modal.removeEventListener("keydown", handleKeydown);
    modal.removeEventListener("click", onBackdropClick);
  }

  function onBackdropClick(e) {
    if (e.target === modal) close();
  }

  // === OPEN / CLOSE ===
  function open() {
    modal.style.display = "block";
    attachLifecycle();
    // move focus into modal
    setTimeout(() => {
      const firstInput = content.querySelector("input, button, [tabindex]");
      (firstInput || content).focus();
    }, 0);
  }

  function close() {
    modal.dispatchEvent(new Event("close"));
    modal.style.display = "none";
  }

  // Optionally open positioned at x/y (for context menus, etc.)
  function openAt(x, y) {
    open();
    content.style.top = `${y}px`;
    content.style.left = `${x}px`;
    content.style.transform = `translate(0, 0)`;
  }

  return {
    modal,
    header,
    content,
    open,
    close,
    openAt,
  };
}
