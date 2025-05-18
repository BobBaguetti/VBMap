// @file: src/shared/ui/core/modalCore.js
// @version: 1.1 — open definition modals with flex layout

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
 * Open a modal (any type).
 */
export function openModal(modal) {
  // Definition modals use flex to center; others use block
  const isDefinition = modal.classList.contains("modal--definition");
  modal.style.display = isDefinition ? "flex" : "block";
  modal.style.zIndex  = "9999";
  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal);
  }
}

/**
 * Close a modal.
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
