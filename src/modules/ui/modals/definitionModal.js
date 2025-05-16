// @file: src/modules/ui/modals/definitionModal.js
// @version: 1.3 — fix openEdit reference by hoisting function definitions

import { createModal, openModal, closeModal }    from "../components/uiKit/modalKit.js";
import { definitionTypes }                       from "../../definition/types.js";
import { createDefListContainer }                 from "../../utils/listUtils.js";
import { createPreviewController }                from "../preview/previewController.js";
import { createDefinitionListManager }            from "../components/definitionListManager.js";

export function initDefinitionModal(db) {
  let modal, content;
  let fldType, listApi, formApi, previewApi, formContainer;
  let definitions = [], currentType, currentId;

  // Build or refresh the definitions list
  async function refreshList() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  // The edit flow, called from the list manager
  async function openEdit(def) {
    await build();
    currentType   = def.type;
    fldType.value = currentType;
    await refreshList();

    // Instantiate form controller
    const cfg = definitionTypes[currentType];
    formContainer.innerHTML = "";
    formApi = cfg.controller({
      onCancel:   () => { formApi.reset(); previewApi.hide(); },
      onDelete:   async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset();
        previewApi.hide();
      },
      onSubmit:   async payload => {
        payload.id = def.id;
        await cfg.save(db, payload.id, payload);
        await refreshList();
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => previewApi.show(data)
    }, db);
    formContainer.appendChild(formApi.form);

    // Populate and preview
    currentId = def.id;
    formApi.populate(def);
    previewApi.show(def);

    openModal(modal);
  }

  // The create flow
  async function openCreate(evt, type) {
    await build();
    currentType   = type || Object.keys(definitionTypes)[0];
    fldType.value = currentType;
    await refreshList();

    // Instantiate form controller
    const cfg = definitionTypes[currentType];
    formContainer.innerHTML = "";
    formApi = cfg.controller({
      onCancel:   () => { formApi.reset(); previewApi.hide(); },
      onDelete:   async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset();
        previewApi.hide();
      },
      onSubmit:   async payload => {
        if (payload.id) {
          await cfg.save(db, payload.id, payload);
        } else {
          await cfg.save(db, null, payload);
        }
        await refreshList();
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => previewApi.show(data)
    }, db);
    formContainer.appendChild(formApi.form);

    // Initialize state
    currentId = null;
    formApi.reset();
    previewApi.hide();

    openModal(modal);
  }

  // Build the modal shell, list, and wiring
  async function build() {
    if (modal) return;
    // 1) Create modal
    ({ modal, content } = createModal({
      id:         "definition-modal",
      title:      "Manage Definitions",
      size:       "large",
      searchable: true,
      onClose:    () => previewApi.hide()
    }));
    modal.classList.add("admin-only");

    // 2) Type selector
    const labType = document.createElement("label");
    labType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      ${Object.keys(definitionTypes)
        .map(t => `<option value="${t}">${t}</option>`)
        .join("")}
    `;
    labType.appendChild(fldType);

    // 3) List + Form + Preview containers
    const listContainer = createDefListContainer("def-list");
    formContainer = document.createElement("div");
    formContainer.id = "def-form-container";
    previewApi = createPreviewController("item");

    content.append(labType, listContainer, formContainer);

    // 4) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openEdit(def),
      onDelete:       async id => {
        await definitionTypes[currentType].del(db, id);
        await refreshList();
      }
    });

    // 5) Search wiring
    const searchInput = modal.querySelector(".modal__search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        listApi.filter(searchInput.value);
      });
    }
  }

  return { openCreate, openEdit };
}
