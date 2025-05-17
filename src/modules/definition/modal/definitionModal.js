// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.8 — use named slots from modalFactory for left/right panes

import { createModal, openModal, closeModal }
  from "../../../shared/ui/core/modalFactory.js";
import { definitionTypes } from "../types.js";
import { createDefListContainer } from "../../../shared/utils/listUtils.js";
import { createPreviewController } from "../preview/previewController.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content, header, slots;
  let fldType, listApi, formApi, previewApi;
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

    // create large modal with two named slots: left and preview
    ({ modal, content, header, slots } = createModal({
      id:       "definition-modal",
      title:    "Manage Definitions",
      size:     "large",
      onClose:  () => previewApi?.hide(),
      slots:    ["left", "preview"]
    }));
    modal.classList.add("admin-only", "modal--definitions");
    content.classList.add("modal__body--definitions");

    // assign slot elements
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";
    previewContainer = slots.preview;
    previewContainer.id = "definition-preview-container";

    // 1) Search bar
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    leftPane.append(searchInput);

    // 2) Type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);
    leftPane.append(typeLabel);

    // 3) Definitions list & form container
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(listContainer, formContainer);

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

    // 5) Search filtering
    searchInput.addEventListener("input", () => {
      listApi.filter(searchInput.value);
    });
  }

  async function openCreate(evt, type = "Item") {
    await build();
    currentType   = type;
    fldType.value = currentType;
    await refreshList();

    if (currentType === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = createPreviewController(
      currentType.toLowerCase(),
      previewContainer
    );

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

    formApi.initPickrs?.();
    formApi.reset();
    previewApi.show(currentType === "Chest" ? { lootPool: [] } : {});

    openModal(modal);
  }

  async function openEdit(def) {
    await build();
    fldType.value = currentType;
    await refreshList();

    if (currentType === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = createPreviewController(
      currentType.toLowerCase(),
      previewContainer
    );

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

    formApi.initPickrs?.();
    formApi.populate(def);
    const initialPreview = currentType === "Chest"
      ? { ...def, lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean) }
      : def;
    previewApi.show(initialPreview);

    openModal(modal);
  }

  return { openCreate, openEdit };
}
