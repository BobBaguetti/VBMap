// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.6 — updated modal import to modalFactory

import { createModal, openModal, closeModal }        from "../../../shared/ui/core/modalFactory.js";
import { definitionTypes }                           from "../types.js";
import { createDefListContainer }                     from "../../../shared/utils/listUtils.js";
import { createPreviewController }                    from "../preview/previewController.js";
import { createDefinitionListManager }                from "../list/definitionListManager.js";
import { loadItemDefinitions }                       from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content;
  let fldType, listApi, formApi, previewApi, formContainer, searchInput;
  let definitions = [], currentType, currentId;
  let itemMap = {}; // for chest lootPool hydration

  // Fetch and refresh the list of definitions for the active type
  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  // Build modal shell only once
  async function build() {
    if (modal) return;

    ({ modal, content } = createModal({
      id:         "definition-modal",
      title:      "Manage Definitions",
      size:       "large",
      onClose:    () => previewApi?.hide()
    }));
    modal.classList.add("admin-only");

    // 1) Search bar
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "modal__search";
    searchInput.placeholder = "Search definitions…";
    content.append(searchInput);

    // 2) Type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);

    // 3) List & form containers
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";

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

    // 5) Wire modal search to list filter
    searchInput.addEventListener("input", () => {
      listApi.filter(searchInput.value);
    });
  }

  // Open the modal to create a new definition
  async function openCreate(evt, type = "Item") {
    await build();

    currentType   = type;
    currentId     = null;
    fldType.value = currentType;
    await refreshList();

    // If chest, preload item definitions
    if (currentType === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = createPreviewController(currentType.toLowerCase());

    // Instantiate and render form
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
      onFieldChange: data => {
        // Hydrate chest lootPool from IDs to objects
        let previewData = data;
        if (currentType === "Chest" && Array.isArray(data.lootPool)) {
          previewData = {
            ...data,
            lootPool: data.lootPool.map(id => itemMap[id]).filter(Boolean)
          };
        }
        previewApi.show(previewData);
      }
    }, db);
    formContainer.append(formApi.form);

    // Initialize Pickr swatches and reset preview pane
    formApi.initPickrs?.();
    formApi.reset();
    previewApi.show(currentType === "Chest" ? { lootPool: [] } : {});

    openModal(modal);
  }

  // Open the modal to edit an existing definition
  async function openEdit(def) {
    await build();

    // Keep existing currentType
    fldType.value = currentType;
    await refreshList();

    // If chest, preload item definitions
    if (currentType === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = createPreviewController(currentType.toLowerCase());

    // Instantiate and render form
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
      onFieldChange: data => {
        let previewData = data;
        if (currentType === "Chest" && Array.isArray(data.lootPool)) {
          previewData = {
            ...data,
            lootPool: data.lootPool.map(id => itemMap[id]).filter(Boolean)
          };
        }
        previewApi.show(previewData);
      }
    }, db);
    formContainer.append(formApi.form);

    // Initialize Pickr, populate form and preview
    formApi.initPickrs?.();
    formApi.populate(def);
    const initialPreview = currentType === "Chest"
      ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
      : def;
    previewApi.show(initialPreview);

    openModal(modal);
  }

  return { openCreate, openEdit };
}
