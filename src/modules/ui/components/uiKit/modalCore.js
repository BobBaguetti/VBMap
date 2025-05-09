// @file: src/modules/ui/components/uiKit/modalCore.js
// @version: 1.1 — core modal DOM & lifecycle only

/**
 * Attach overflow-lock & focus-restore when a modal opens.
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
 * Create the barebones modal structure: wrapper, header, and content area.
 *
 * @param {object} options
 * @param {string} options.id
 * @param {string} options.title
 * @param {boolean} [options.withDivider]
 * @returns {{ modal: HTMLElement, content: HTMLElement, header: HTMLElement }}
 */
export function createModal({
  id,
  title,
  withDivider = false
}) {
  const modal = document.createElement("div");
  modal.id = id;
  // CSS classes control size & backdrop; core does not set them
  modal.classList.add("modal");

  const content = document.createElement("div");
  content.classList.add("modal-content");

  const header = document.createElement("div");
  header.classList.add("modal-header");

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("modal-close-btn");
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => {
    closeModal(modal);
  };

  header.append(titleEl, closeBtn);
  content.append(header);

  if (withDivider) {
    content.append(document.createElement("hr"));
  }

  modal.append(content);
  document.body.append(modal);

  // clicking on backdrop (modal itself) closes
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  return { modal, content, header };
}

/**
 * Open (show) a modal, lock scroll, and attach lifecycle.
 */
export function openModal(modal) {
  modal.style.display = "block";
  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal);
  }
}

/**
 * Close (hide) a modal and dispatch its "close" event.
 */
export function closeModal(modal) {
  modal.style.display = "none";
  modal.dispatchEvent(new Event("close"));
}
