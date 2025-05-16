// @file: src/modules/ui/modals/definitionModal.js
// @version: 1.0 — unified, schema-driven definition modal

import { createModal, openModal, closeModal }        from "../components/uiKit/modalKit.js";
import { definitionTypes }                           from "../../definition/types.js";
import { createDefListContainer }                     from "../../utils/listUtils.js";
import { createPreviewController }                    from "../preview/previewController.js";
import { createDefinitionListManager }                from "../components/definitionListManager.js";

export function initDefinitionModal(db) {
  let modal, content;
  let fldType, listApi, formApi, previewApi, formContainer;
  let definitions = [], currentType, currentId;

  // Fetch and refresh the list of definitions for the active type
  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  // Build modal shell only once
  async function build() {
    if (modal) return;

    // 1) Create modal shell
    ({ modal, content } = createModal({
      id:         "definition-modal",
      title:      "Manage Definitions",
      size:       "large",
      searchable: true,
      onClose:    () => previewApi.hide()
    }));
    modal.classList.add("admin-only");

    // 2) Type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.appendChild(fldType);

    // 3) List, form container, and preview controller
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    previewApi = createPreviewController(); // auto-detect type if needed

    content.append(typeLabel, listContainer, formContainer);

    // 4) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openEdit(def),
      onDelete:       async id => {
        const cfg = definitionTypes[currentType];
        await cfg.del(db, id);
        await refreshList();
      }
    });

    // 5) Search within the modal
    const searchInput = modal.querySelector(".modal__search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        listApi.filter(searchInput.value);
      });
    }
  }

  // Open the modal to create a new definition
  async function openCreate(evt, type = "Item") {
    await build();

    // Select type and refresh list
    currentType = type;
    fldType.value = currentType;
    await refreshList();

    // Instantiate form for this type
    const cfg = definitionTypes[currentType];
    formContainer.innerHTML = "";
    const { form, fields, colorables } = cfg.buildForm();
    formApi = cfg.controller({
      onCancel:     () => { formApi.reset(); previewApi.hide(); },
      onDelete:     async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:     async payload => {
        if (payload.id) {
          await cfg.save(db, payload.id, payload);
        } else {
          await cfg.save(db, null, payload);
        }
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onFieldChange:data => previewApi.show(data)
    }, db);
    formContainer.appendChild(formApi.form);

    // Reset for new entry
    currentId = null;
    formApi.reset();
    previewApi.hide();

    // Show modal
    openModal(modal);
  }

  // Open the modal to edit an existing definition
  async function openEdit(def) {
    await build();

    // Select type and refresh list
    currentType = def.type;
    fldType.value = currentType;
    await refreshList();

    // Instantiate form for this type
    const cfg = definitionTypes[currentType];
    formContainer.innerHTML = "";
    formApi = cfg.controller({
      onCancel:     () => { formApi.reset(); previewApi.hide(); },
      onDelete:     async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:     async payload => {
        payload.id = def.id;
        await cfg.save(db, payload.id, payload);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onFieldChange:data => previewApi.show(data)
    }, db);
    formContainer.appendChild(formApi.form);

    // Populate for editing
    currentId = def.id;
    formApi.populate(def);
    previewApi.show(def);

    // Show modal
    openModal(modal);
  }

  return { openCreate, openEdit };
}
