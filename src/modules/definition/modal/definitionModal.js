// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.17 — import Form class and fix Form usage

import { createDefinitionModal }    from "../../../shared/ui/core/createDefinitionModal.js";
import { openModal }                from "../../../shared/ui/core/modalCore.js";
import { definitionTypes }          from "../types.js";
import { createDefListContainer }    from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";
import { Form }                     from "../../../shared/ui/forms/Form.js";

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

    // 1) Search bar in header
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.append(searchInput);

    // 2) Left pane setup
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";

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

    // 3) Preview pane
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

    // 6) Render form using Form class
    formContainer.innerHTML = "";
    formObj = new Form(cfg.schema, {
      title:       type,
      hasFilter:   false,
      onCancel:    () => { formObj.reset(); previewApi.hide(); },
      onDelete:    async () => {
        if (def?.id) {
          await cfg.del(db, def.id);
          await refreshList();
          formObj.reset();
          previewApi.hide();
        }
      },
      onSubmit:    async payload => {
        await cfg.save(db, def?.id ?? null, payload);
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
    formContainer.append(formObj.form);
    formObj.initPickrs?.();

    // 7) Populate or reset form
    if (def) {
      formObj.populate(def);
      const previewData = type === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
        : def;
      previewApi.show(previewData);
    } else {
      formObj.reset();
      previewApi.show(type === "Chest" ? { lootPool: [] } : {});
    }

    // 8) Open modal
    modal.open();
  }

  return {
    openCreate: (evt, type = "Item") => openDefinition(type),
    openEdit:   def                => openDefinition(currentType, def)
  };
}
