// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.22 — fully self-contained: inlined modal creation + lifecycle

import { definitionTypes }        from "../types.js";
import { createDefListContainer }  from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";
import { createFieldRow } from "../../../shared/ui/components/formFields.js";
import { initFormPickrs } from "../../../shared/ui/forms/pickrAdapter.js";
import { createFormState } from "../../../shared/ui/forms/formStateManager.js";

/** ─── Shared form-header logic inlined ───────────────────────────────── */
function createFormControllerHeader({ title, hasFilter = false, onFilter, onCancel, onDelete }) {
  const wrap = document.createElement("div");
  wrap.className = "modal-subheader form-controller-header";

  const h3 = document.createElement("h3");
  h3.textContent = `Add ${title}`;
  wrap.appendChild(h3);

  let filterCheckbox;
  if (hasFilter) {
    const fc = document.createElement("div");
    fc.className = "form-filter-toggle";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id   = "fld-show-in-filters";
    chk.addEventListener("change", () => onFilter(chk.checked));
    const lbl = document.createElement("label");
    lbl.htmlFor = chk.id;
    lbl.textContent = "Show in filters";
    fc.append(lbl, chk);
    wrap.append(fc);
    filterCheckbox = chk;
  }

  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type      = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type      = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick   = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type      = "button";
  btnDelete.className = "btn-delete";
  btnDelete.title     = "Delete";
  btnDelete.innerHTML = "🗑";
  btnDelete.onclick   = onDelete;
  btnDelete.hidden    = true;

  btnRow.append(btnSave, btnClear, btnDelete);
  wrap.append(btnRow);

  return {
    container: wrap,
    subheading: h3,
    filterCheckbox,
    setDeleteVisible: v => {
      btnDelete.hidden = !v;
      h3.textContent   = v ? `Edit ${title}` : `Add ${title}`;
    }
  };
}

function wireFormEvents(form, getCustom, onSubmit, onFieldChange) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit(getCustom());
  });
  form.addEventListener("input", () => onFieldChange(getCustom()));
}

/** ─── Modal creation & lifecycle inlined ─────────────────────────────── */
function attachModalLifecycle(modal) {
  const prevFocused = document.activeElement;
  const scrollY     = window.scrollY;
  document.documentElement.style.overflow = "hidden";
  modal.dataset.lifecycleAttached = "true";
  modal.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    prevFocused?.focus?.();
  }, { once: true });
}
function openModal(modal) {
  modal.classList.add("is-open");
  if (!modal.dataset.lifecycleAttached) attachModalLifecycle(modal);
}
function closeModal(modal) {
  modal.classList.remove("is-open");
  modal.dispatchEvent(new Event("close"));
}

/** ─── Definition modal implementation ───────────────────────────────── */
export function initDefinitionModal(db) {
  let modal, content, header, slots;
  let fldType, listApi, formApi, previewApi;
  let formContainer, previewContainer, searchInput, subheaderPlaceholder;
  let definitions = [], currentType, itemMap = {};

  function buildModalShell() {
    modal = document.createElement("div");
    modal.id = "definition-modal";
    modal.className = "modal--definition hidden";  // hidden until open
    document.body.append(modal);

    content = document.createElement("div");
    content.className = "modal-content";
    modal.append(content);

    // Header
    header = document.createElement("div");
    header.className = "modal-header";
    const titleEl = document.createElement("h2");
    titleEl.textContent = "Manage Definitions";
    const closeBtn = document.createElement("span");
    closeBtn.className = "close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => closeModal(modal);
    header.append(titleEl, closeBtn);
    content.append(header);

    // Search input
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.insertBefore(searchInput, closeBtn);

    // Type selector
    fldType = document.createElement("select");
    fldType.id = "definition-type";
    Object.keys(definitionTypes).forEach(t => {
      const o = document.createElement("option");
      o.value = t; o.textContent = t;
      fldType.append(o);
    });
    header.insertBefore(fldType, searchInput);

    // Left pane
    const leftPane = document.createElement("div");
    leftPane.id = "definition-left-pane";
    content.append(leftPane);

    // List
    const listContainer = createDefListContainer("definition-list");
    leftPane.append(listContainer);
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete:       async id => {
        await definitionTypes[currentType].del(db, id);
        refreshList();
      }
    });
    searchInput.addEventListener("input", () => listApi.filter(searchInput.value));

    // Subheader placeholder
    subheaderPlaceholder = document.createElement("div");
    leftPane.append(subheaderPlaceholder);

    // Form container
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(formContainer);

    // Preview pane
    previewContainer = document.createElement("div");
    previewContainer.id = "definition-preview-container";
    content.append(previewContainer);

    // Close on backdrop
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  }

  async function refreshList() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh();
  }

  async function openDefinition(type, def = null) {
    if (!modal) buildModalShell();
    currentType = type;
    await refreshList();

    // Preview setup
    const cfg = definitionTypes[type];
    previewApi = cfg.previewBuilder(previewContainer);

    // Build form
    formContainer.innerHTML = "";
    const buildResult = cfg.builder(); // assume builder returns form + fields + colorables
    formApi = cfg.controller(buildResult, type, {
      hasFilter: true,
      onCancel:  () => { formApi.reset(); previewApi.hide(); },
      onDelete:  async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:  async payload => {
        await cfg.save(db, def?.id ?? null, payload);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onFieldChange: data => {
        const pd = type === "Chest"
          ? { ...data, lootPool: data.lootPool.map(i=>itemMap[i]).filter(Boolean) }
          : data;
        previewApi.show(pd);
      }
    });
    // Replace placeholder with real subheader
    const hdr = formApi.form.querySelector(".modal-subheader");
    subheaderPlaceholder.replaceWith(hdr);

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) formApi.populate(def); else formApi.reset();
    openModal(modal);
  }

  return { openCreate: openDefinition, openEdit: openDefinition };
}
