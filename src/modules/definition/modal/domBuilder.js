// @file: src/modules/definition/modal/domBuilder.js
// @version: 1.2 — no inline styles; layout is driven by CSS

import { createDefListContainer } from "../../../shared/utils/listUtils.js";

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
  const listContainer = createDefListContainer("definition-list");
  left.append(listContainer);

  // Form subheader placeholder + container
  const subheader = document.createElement("div");
  subheader.className = "modal-subheader";
  const formCont  = document.createElement("div");
  formCont.id      = "definition-form-container";
  left.append(subheader, formCont);

  return {
    header,
    searchInput: search,
    typeSelect: typeSel,
    listContainer,
    subheader,
    formContainer: formCont,
    previewContainer: preview
  };
}
