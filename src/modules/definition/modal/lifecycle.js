// @file: src/modules/definition/modal/lifecycle.js

/**
 * Create a backdrop container and wire ESC/backdrop-to-close.
 * Returns { modalEl, open, close }.
 */
export function createModalShell(id, onClose) {
  const modalEl = document.createElement("div");
  modalEl.id = id;
  modalEl.className = "modal--definition";
  document.body.append(modalEl);

  // Focus/scroll lifecycle
  function attachLifecycle() {
    const prevFocused = document.activeElement;
    const scrollY     = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    modalEl.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollY);
      prevFocused?.focus?.();
    }, { once: true });
  }

  // Open/close
  function open() {
    if (!modalEl.dataset.inited) {
      attachLifecycle();
      modalEl.dataset.inited = "true";
    }
    modalEl.classList.add("is-open");
    document.addEventListener("keydown", onKey);
  }
  function close() {
    modalEl.classList.remove("is-open");
    modalEl.dispatchEvent(new Event("close"));
    document.removeEventListener("keydown", onKey);
    onClose?.();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
  }

  // Backdrop click
  modalEl.addEventListener("click", e => {
    if (e.target === modalEl) close();
  });

  return { modalEl, open, close };
}
