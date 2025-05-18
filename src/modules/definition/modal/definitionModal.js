// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.16 — Step 3b: use the new Form class instead of buildForm + controller

import { createModal, openModal } from "../../../shared/ui/core/modalFactory.js";
import { definitionTypes }        from "../types.js";
import { createDefListContainer }  from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";
import { Form }                    from "../../../shared/ui/forms/Form.js";

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

    ({ modal, content, header, slots } = createModal({
      id:      "definition-modal",
      title:   "Manage Definitions",
      size:    "large",
      onClose: () => previewApi?.hide(),
      slots:   ["left", "preview"]
    }));

    modal.classList.add("admin-only", "modal--definition");

    // Search in header
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.append(searchInput);

    // Left pane: type selector, list & form container
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";

    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);
    leftPane.append(typeLabel);

    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(listContainer, formContainer);

    // Preview pane
    previewContainer = slots.preview;
    previewContainer.id = "definition-preview-container";

    // List manager
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

    // Wire search
    searchInput.addEventListener("input", () =>
      listApi.filter(searchInput.value)
    );
  }

  async function openDefinition(type, def = null) {
    await build();
    currentType   = type;
    fldType.value = type;
    await refreshList();

    // Preload items for Chest
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    const cfg = definitionTypes[type];
    previewApi = cfg.previewBuilder(previewContainer);

    // Clear previous form
    formContainer.innerHTML = "";

    // Instantiate new Form
    formObj = new Form(cfg.schema, {
      title:       def ? `Edit ${type}` : `Add ${type}`,
      hasFilter:   false,
      onFilter:    () => {},          // no filter in form
      onCancel:    () => formObj.reset() && previewApi.hide(),
      onDelete:    async id => {
        await cfg.del(db, id);
        await refreshList();
        formObj.reset();
        previewApi.hide();
      },
      onSubmit:    async payload => {
        const saveId = def?.id ?? null;
        await cfg.save(db, saveId, payload);
        await refreshList();
        formObj.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        let previewData = data;
        if (type === "Chest" && Array.isArray(data.lootPool)) {
          previewData = {
            ...data,
            lootPool: data.lootPool.map(id => itemMap[id]).filter(Boolean)
          };
        }
        previewApi.show(previewData);
      }
    });

    // Add form element to container
    formContainer.append(formObj.form);

    // Initialize and populate
    formObj.initPickrs?.();
    if (def) {
      formObj.populate(def);
      const initialPreview = type === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
        : def;
      previewApi.show(initialPreview);
    } else {
      formObj.reset();
      previewApi.show(type === "Chest" ? { lootPool: [] } : {});
    }

    openModal(modal);
  }

  return {
    openCreate: (evt, type = "Item") => openDefinition(type),
    openEdit:   def                => openDefinition(currentType, def)
  };
}
