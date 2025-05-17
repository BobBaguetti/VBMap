// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.7 — two-column layout for form + preview

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
  let modal, content;
  let fldType, listApi, formApi, previewApi;
  let formContainer, previewContainer, searchInput;
  let definitions = [], currentType, currentId;
  let itemMap = {};

  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  async function build() {
    if (modal) return;

    // 1) modal shell
    ({ modal, content } = createModal({
      id:      "definition-modal",
      title:   "Manage Definitions",
      size:    "large",
      onClose: () => previewApi?.hide()
    }));
    modal.classList.add("admin-only");

    // 2) two-column layout
    content.style.display     = "flex";
    content.style.alignItems  = "flex-start";
    content.style.gap         = "1rem";

    // 3) left pane for search, type selector, list, form
    const leftPane = document.createElement("div");
    leftPane.id = "definition-left-pane";

    // 3.1 search bar
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    leftPane.append(searchInput);

    // 3.2 type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);
    leftPane.append(typeLabel);

    // 3.3 list container
    const listContainer = createDefListContainer("definition-list");
    leftPane.append(listContainer);

    // 3.4 form container
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(formContainer);

    // 4) preview container on the right
    previewContainer = document.createElement("div");
    previewContainer.id = "definition-preview-container";

    // 5) append both panes
    content.append(leftPane, previewContainer);

    // 6) list manager
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

    // 7) filter wiring
    searchInput.addEventListener("input", () => {
      listApi.filter(searchInput.value);
    });
  }

  async function openCreate(evt, type = "Item") {
    await build();

    currentType   = type;
    currentId     = null;
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
      onCancel: data => { formApi.reset(); previewApi.hide(); },
      onDelete: async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit: async payload => {
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
            lootPool: data.lootPool
              .map(id => itemMap[id])
              .filter(Boolean)
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
      onCancel: () => { formApi.reset(); previewApi.hide(); },
      onDelete: async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit: async payload => {
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
            lootPool: data.lootPool
              .map(id => itemMap[id])
              .filter(Boolean)
          };
        }
        previewApi.show(previewData);
      }
    }, db);
    formContainer.append(formApi.form);

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
