// @file: src/shared/ui/core/modalCore.js
// @version: 1.2 — toggle .is-open; CSS handles display & centering

/**
 * Attaches a “restore focus & scroll” handler to a modal.
 */
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

/**
 * Open a modal (any type) by toggling its .is-open class.
 */
export function openModal(modal) {
  modal.classList.add("is-open");
  modal.style.zIndex = "9999";
  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal);
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
export function openModalAt(modal, evt) {
  openModal(modal);
  const content = modal.querySelector(".modal-content");
  const rect    = content.getBoundingClientRect();
  content.style.left = `${evt.clientX - rect.width}px`;
  content.style.top  = `${evt.clientY - rect.height / 2}px`;
}
