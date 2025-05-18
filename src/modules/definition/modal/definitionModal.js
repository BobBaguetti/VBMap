// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.17 — insert search between title and close button

import { createModal, openModal } from "../../../shared/ui/core/modalFactory.js";
import { definitionTypes }        from "../types.js";
import { createDefListContainer }  from "../../../shared/utils/listUtils.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content, header, slots;
  let fldType, listApi, formApi, previewApi;
  let formContainer, previewContainer, searchInput, subheaderEl;
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

    // 1) Search bar — in global header, inserted before the close button
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    const closeBtn = header.querySelector(".close");
    if (closeBtn) {
      header.insertBefore(searchInput, closeBtn);
    } else {
      header.append(searchInput);
    }

    // 2) Left pane: type selector + list + (subheader) + form
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";

    // 2a) Type selector
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(fldType);
    leftPane.append(typeLabel);

    // 2b) Entry list
    const listContainer = createDefListContainer("definition-list");
    leftPane.append(listContainer);

    // 2c) Placeholder for form subheader
    subheaderEl = document.createElement("div");
    subheaderEl.className = "modal-subheader";
    leftPane.append(subheaderEl);

    // 2d) Form container
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(formContainer);

    // 3) Preview pane
    previewContainer = slots.preview;
    previewContainer.id = "definition-preview-container";

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

    // Wire search to list filter
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

    // Clear & render form
    formContainer.innerHTML = "";
    const controllerResult = cfg.controller({
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

    formApi = controllerResult;
    // Move the modal-subheader out of the <form> into our pinned spot
    const generatedHeader = formApi.form.querySelector(".modal-subheader");
    if (generatedHeader) {
      subheaderEl.replaceWith(generatedHeader);
      subheaderEl = generatedHeader;
    }

    // Append the form itself under the subheader
    formContainer.append(formApi.form);
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
    openCreate: (evt, type = "Item") => openDefinition(type),
    openEdit:   def                => openDefinition(currentType, def)
  };
}
