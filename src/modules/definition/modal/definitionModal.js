// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.16 — switch to createDefinitionModal()

import { createDefinitionModal }    from "../../../shared/ui/core/createDefinitionModal.js";
import { openModal }                from "../../../shared/ui/core/modalCore.js";
import { definitionTypes }          from "../types.js";
import { createDefListContainer }    from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content, header, slots;
  let fldType, listApi, formObj, previewApi;
  let formContainer, previewContainer, searchInput;
  let definitions = [], currentType;
  let itemMap = {};

  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  async function build() {
    if (modal) return;

    ({ modal, content, header, slots } = createDefinitionModal({
      id:      "definition-modal",
      title:   "Manage Definitions",
      onClose: () => previewApi?.hide()
    }));

    // 1) Move search bar into header
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.append(searchInput);

    // 2) Left pane: type selector, list & form
    const leftPane = slots.left;
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);

    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(typeLabel, listContainer, formContainer);

    // 3) Preview pane stays empty slot
    previewContainer = slots.preview;

    // 4) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete:       async id => {
        const cfg = definitionTypes[currentType];
        await cfg.del(db, id);
        await refreshList();
      }
    });

    // 5) Wire search → filter
    searchInput.addEventListener("input", () =>
      listApi.filter(searchInput.value)
    );
  }

  async function openDefinition(type, def = null) {
    await build();
    currentType   = type;
    fldType.value = type;
    await refreshList();

    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    const cfg = definitionTypes[type];
    previewApi = cfg.previewBuilder(previewContainer);

    // Clear and render form
    formContainer.innerHTML = "";
    formObj = new Form(cfg.schema, {
      title,
      hasFilter: false,
      onCancel:  () => { formObj.reset(); previewApi.hide(); },
      onDelete:  async () => { /* ... */ },
      onSubmit:  async payload => { /* ... */ },
      onFieldChange: data => previewApi.show(/* ... */)
    });
    formContainer.append(formObj.form);
    formObj.initPickrs?.();

    if (def) formObj.populate(def);
    else     formObj.reset();

    modal.open();
  }

  return {
    openCreate: (evt, type = "Item") => openDefinition(type),
    openEdit:   def                => openDefinition(currentType, def)
  };
}
