// @file: src/shared/ui/core/modalCore.js
// @version: 1.3 — added Escape key handling for closing modals

/**
 * Attaches lifecycle handlers to a modal: focus/scroll restore and Escape‐to‐close.
 */
function attachModalLifecycle(modal, onClose) {
  const prevFocused = document.activeElement;
  const scrollY     = window.scrollY;
  document.documentElement.style.overflow = "hidden";

  function restore() {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    prevFocused?.focus?.();
    // Remove Escape key listener
    if (modal._escHandler) {
      document.removeEventListener("keydown", modal._escHandler);
      delete modal._escHandler;
    }
  }

  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeModal(modal);
      onClose?.();
    }
  };
  modal._escHandler = escHandler;
  document.addEventListener("keydown", escHandler);

  modal.dataset.lifecycleAttached = "true";
  modal.addEventListener("close", restore, { once: true });
}

/**
 * Open a modal (any type) by toggling its .is-open class.
 */
export function openModal(modal, onClose) {
  modal.classList.add("is-open");
  modal.style.zIndex = "9999";
  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal, onClose);
  }
}

/**
 * Close a modal by removing its .is-open class.
 */
export function closeModal(modal) {
  modal.classList.remove("is-open");
  modal.dispatchEvent(new Event("close"));
}

/**
 * Open a modal positioned near an event (e.g. context menu).
 */
export function openModalAt(modal, evt, onClose) {
  openModal(modal, onClose);
  const content = modal.querySelector(".modal-content");
  const rect    = content.getBoundingClientRect();
  content.style.left = `${evt.clientX - rect.width}px`;
  content.style.top  = `${evt.clientY - rect.height / 2}px`;
}
