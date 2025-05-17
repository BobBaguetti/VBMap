// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.9 — unified openCreate/openEdit into single openDefinition helper

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

    ({ modal, content, header, slots } = createModal({
      id:      "definition-modal",
      title:   "Manage Definitions",
      size:    "large",
      onClose: () => previewApi?.hide(),
      slots:   ["left", "preview"]
    }));

    modal.classList.add("admin-only", "modal--definitions");
    content.classList.add("modal__body--definitions");

    // left pane slot
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";

    // preview pane slot
    previewContainer = slots.preview;
    previewContainer.id = "definition-preview-container";

    // search input
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    leftPane.append(searchInput);

    // type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);
    leftPane.append(typeLabel);

    // definitions list & form
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(listContainer, formContainer);

    // list manager
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

    // filter wiring
    searchInput.addEventListener("input", () => {
      listApi.filter(searchInput.value);
    });
  }

  async function openDefinition(type, def = null) {
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
        const saveId = def?.id ?? null;
        await cfg.save(db, saveId, payload);
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

    if (def) {
      formApi.populate(def);
      const initialPreview = currentType === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean) }
        : def;
      previewApi.show(initialPreview);
    } else {
      formApi.reset();
      previewApi.show(
        currentType === "Chest" ? { lootPool: [] } : {}
      );
    }

    openModal(modal);
  }

  return {
    openCreate: (evt, type = "Item") => openDefinition(type),
    openEdit:   def => openDefinition(currentType, def)
  };
}
