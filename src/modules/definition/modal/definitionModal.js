// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.13 — single‐column modal, floating preview

import { createModal, openModal } from "../../../shared/ui/core/modalFactory.js";
import { definitionTypes }        from "../types.js";
import { createDefListContainer }  from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content, header;
  let fldType, listApi, formApi, previewApi;
  let formContainer, searchInput;
  let definitions = [], currentType;
  let itemMap = {};

  async function refreshList() {
    const cfg = definitionTypes[currentType];
    definitions = await cfg.loadDefs(db);
    listApi.refresh(definitions);
  }

  async function build() {
    if (modal) return;

    ({ modal, content, header } = createModal({
      id:      "definition-modal",
      title:   "Manage Definitions",
      size:    "large",
      onClose: () => previewApi?.hide()
    }));

    modal.classList.add("admin-only", "modal--definition");
    // content is .modal-content; keep its flex‐column layout

    // 1) Search bar
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
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
    content.append(typeLabel);

    // 3) List & form containers
    const listContainer = createDefListContainer("definition-list");
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    content.append(listContainer, formContainer);

    // 4) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete: async id => {
        const cfg = definitionTypes[currentType];
        await cfg.del(db, id);
        await refreshList();
      }
    });

    // 5) Wire search
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
    previewApi = cfg.previewBuilder();  // no host => floating

    // Build form
    formContainer.innerHTML = "";
    formApi = cfg.controller({
      onCancel:     () => { formApi.reset(); previewApi.hide(); },
      onDelete:     async id => {
        await cfg.del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:     async payload => {
        await cfg.save(db, def?.id ?? null, payload);
        await refreshList();
        formApi.reset(); previewApi.hide();
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
    }, db);
    content.append(formApi.form);

    // Init & populate
    formApi.initPickrs?.();
    if (def) {
      formApi.populate(def);
      const previewData = type === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
        : def;
      previewApi.show(previewData);
    } else {
      formApi.reset();
      previewApi.show(type === "Chest" ? { lootPool: [] } : {});
    }

    openModal(modal);
  }

  return {
    openCreate: (evt, type="Item") => openDefinition(type),
    openEdit:   def               => openDefinition(currentType, def)
  };
}
