// @file: src/modules/definition/modal/modalCore.js
// @version: 1.0 — combined lifecycle + DOM builder for unified Definitions modal

import { createDefListContainer } from "./listUtils.js";

/**
 * Create a modal shell with backdrop, ESC/backdrop-to-close,
 * and build the static DOM structure for the Definitions modal.
 *
 * Returns:
 *   {
 *     modalEl,
 *     open,
 *     close,
 *     refs: {
 *       header,
 *       searchInput,
 *       typeSelect,
 *       listContainer,
 *       subheader,
 *       formContainer,
 *       previewContainer
 *     }
 *   }
 */
export function createModalCore(id = "definition-modal", onClose) {
  // 1) Create backdrop & shell element
  const modalEl = document.createElement("div");
  modalEl.id = id;
  modalEl.className = "modal--definition";
  document.body.append(modalEl);

  // 2) Focus/scroll lifecycle
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

  // 3) Open/close functions
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

  // 4) Backdrop click to close
  modalEl.addEventListener("click", e => {
    if (e.target === modalEl) close();
  });

  // 5) Build static DOM inside the modal
  const content = document.createElement("div");
  content.className = "modal-content";
  modalEl.append(content);

  // Header
  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h2");
  title.textContent = "Manage Definitions";
  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => close();
  header.append(title, closeBtn);
  content.append(header);

  // Search input
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "modal__search";
  searchInput.placeholder = "Search definitions…";
  header.insertBefore(searchInput, closeBtn);

  // Type selector
  const typeWrapper = document.createElement("div");
  typeWrapper.className = "modal__type-selector";
  const typeLbl = document.createElement("span");
  typeLbl.textContent = "Type:";
  const typeSelect = document.createElement("select");
  typeSelect.id = "definition-type";
  typeWrapper.append(typeLbl, typeSelect);
  header.insertBefore(typeWrapper, closeBtn);

  // PANE slots: left (list + form), right (preview)
  const left = document.createElement("div");
  left.id = "definition-left-pane";
  const previewContainer = document.createElement("div");
  previewContainer.id = "definition-preview-container";
  content.append(left, previewContainer);

  // Definition list container
  const listContainer = createDefListContainer("definition-list");
  left.append(listContainer);

  // Subheader placeholder (form header will replace this)
  const subheader = document.createElement("div");
  subheader.className = "modal-subheader";
  left.append(subheader);

  // Form container
  const formContainer = document.createElement("div");
  formContainer.id = "definition-form-container";
  left.append(formContainer);

  return {
    modalEl,
    open,
    close,
    refs: {
      header,
      searchInput,
      typeSelect,
      listContainer,
      subheader,
      formContainer,
      previewContainer
    }
  };
}
