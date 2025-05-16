// @file: src/modules/ui/modals/definitionModal.js
// @version: 1.4 — add search bar and re-init Pickr swatches on open

import { createModal, openModal, closeModal }        from "../components/uiKit/modalKit.js";
import { definitionTypes }                           from "../../definition/types.js";
import { createDefListContainer }                     from "../../utils/listUtils.js";
import { createPreviewController }                    from "../preview/previewController.js";
import { createDefinitionListManager }                from "../components/definitionListManager.js";

export function initDefinitionModal(db) {
  let modal, content;
  let fldType, listApi, formApi, previewApi, formContainer, searchInput;
  let definitions = [], currentType, currentId;

  // Fetch and refresh definitions list for the active type
  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  // Build modal shell only once
  async function build() {
    if (modal) return;

    // 1) Create modal shell with searchable disabled (we inject our own)
    ({ modal, content } = createModal({
      id:         "definition-modal",
      title:      "Manage Definitions",
      size:       "large",
      onClose:    () => previewApi?.hide()
    }));
    modal.classList.add("admin-only");

    // 2) Inject our search bar
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "modal__search";
    searchInput.placeholder = "Search definitions…";
    content.appendChild(searchInput);

    // 3) Type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.appendChild(fldType);

    // 4) List and form container
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";

    content.append(typeLabel, listContainer, formContainer);

    // 5) List manager
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

    // 6) Wire search
    searchInput.addEventListener("input", () => {
      listApi.filter(searchInput.value);
    });
  }

  // Open the modal to create a new definition
  async function openCreate(evt, type = "Item") {
    await build();

    currentType    = type;
    currentId      = null;
    fldType.value  = currentType;
    await refreshList();

    // Preview
    previewApi = createPreviewController(currentType.toLowerCase());

    // Instantiate form
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
        if (payload.id) await cfg.save(db, payload.id, payload);
        else             await cfg.save(db, null, payload);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onFieldChange:data => previewApi.show(data)
    }, db);
    formContainer.appendChild(formApi.form);

    // Re-init Pickr swatches (in case DOM was re-rendered)
    formApi.initPickrs?.();

    // Reset and hide preview
    formApi.reset();
    previewApi.hide();

    openModal(modal);
  }

  // Open the modal to edit an existing definition
  async function openEdit(def) {
    await build();

    // Keep currentType from create or default
    fldType.value = currentType;
    await refreshList();

    // Preview
    previewApi = createPreviewController(currentType.toLowerCase());

    // Instantiate form
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

    // Re-init Pickr swatches
    formApi.initPickrs?.();

    // Populate and preview
    currentId = def.id;
    formApi.populate(def);
    previewApi.show(def);

    openModal(modal);
  }

  return { openCreate, openEdit };
}
