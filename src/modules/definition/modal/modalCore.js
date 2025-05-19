// @file: src/modules/definition/modal/modalCore.js
// @version: 1.0 — merged lifecycle and DOM-builder for definition modal

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

/**
 * Build the static DOM skeleton for the definition modal.
 * Returns references to key elements for wiring.
 */
export function buildModalUI(modalEl) {
  // CONTENT wrapper
  const content = document.createElement("div");
  content.className = "modal-content";
  modalEl.append(content);

  // HEADER
  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h2");
  title.textContent = "Manage Definitions";
  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  header.append(title, closeBtn);
  content.append(header);

  // Search & Type in header
  const search = document.createElement("input");
  search.type = "search";
  search.className = "modal__search";
  search.placeholder = "Search definitions…";
  header.insertBefore(search, closeBtn);

  const typeWrapper = document.createElement("div");
  typeWrapper.className = "modal__type-selector";
  const typeLbl = document.createElement("span");
  typeLbl.textContent = "Type:";
  const typeSel = document.createElement("select");
  typeSel.id = "definition-type";
  typeWrapper.append(typeLbl, typeSel);
  header.insertBefore(typeWrapper, closeBtn);

  // PANE slots
  const left = document.createElement("div");
  left.id = "definition-left-pane";
  const preview = document.createElement("div");
  preview.id = "definition-preview-container";
  content.append(left, preview);

  // List
  // Note: definitionListManager will render into this container
  const listContainer = document.createElement("div");
  listContainer.id = "definition-list";
  left.append(listContainer);

  // Form subheader placeholder + container
  const subheader = document.createElement("div");
  subheader.className = "modal-subheader";
  const formCont  = document.createElement("div");
  formCont.id      = "definition-form-container";
  left.append(subheader, formCont);

  return {
    header,
    searchInput:   search,
    typeSelect:    typeSel,
    listContainer,
    subheader,
    formContainer: formCont,
    previewContainer: preview,
    closeBtn
  };
}
