// @file: src/modules/definition/modal/domBuilder.js
// @version: 1.3 — moved layout rules to CSS; added .modal-body

import { createDefListContainer } from "../../../shared/utils/listUtils.js";

export function buildModalUI(modalEl) {
  // CONTENT wrapper (styled entirely via CSS)
  const content = document.createElement("div");
  content.className = "modal-content";
  modalEl.append(content);

  // HEADER (unchanged)
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

  // BODY wrapper for side-by-side panes
  const body = document.createElement("div");
  body.className = "modal-body";
  content.append(body);

  // Left pane: list + form
  const left = document.createElement("div");
  left.id = "definition-left-pane";
  // List
  const listContainer = createDefListContainer("definition-list");
  left.append(listContainer);
  // Form subheader placeholder + container
  const subheader = document.createElement("div");
  subheader.className = "modal-subheader";
  const formCont = document.createElement("div");
  formCont.id = "definition-form-container";
  left.append(subheader, formCont);

  // Preview pane
  const preview = document.createElement("div");
  preview.id = "definition-preview-container";

  // Assemble body
  body.append(left, preview);

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
