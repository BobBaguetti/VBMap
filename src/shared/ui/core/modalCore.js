// @file: src\shared\ui\core\modalCore.js
// @version: 1.0 — shared modal lifecycle & show/hide helpers

/**
 * Attaches a “restore focus & scroll” handler to a `<dialog>`-style modal.
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
 * Open a modal (any size).
 */
export function openModal(modal) {
  modal.style.display = "block";
  modal.style.zIndex  = "9999";
  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal);
  }
}

/**
 * Close a modal (any size).
 */
export function closeModal(modal) {
  modal.style.display = "none";
  modal.style.zIndex  = "-1";
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
