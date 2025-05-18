// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.18 — type selector in header; filter checkbox in subheader; dynamic Add/Edit title

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

    // 1) Type selector → header, after title, before close
    const typeWrapper = document.createElement("div");
    typeWrapper.className = "modal__type-selector";
    const typeLabel = document.createElement("span");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.id = "definition-type";
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeWrapper.append(typeLabel, fldType);
    const closeBtn = header.querySelector(".close");
    header.insertBefore(typeWrapper, closeBtn);

    // 2) Search bar — in header, before close button
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.insertBefore(searchInput, closeBtn);

    // 3) Left pane: list + subheader placeholder + form
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";

    // entry list
    const listContainer = createDefListContainer("definition-list");
    leftPane.append(listContainer);

    // placeholder for form subheader
    subheaderEl = document.createElement("div");
    subheaderEl.className = "modal-subheader";
    leftPane.append(subheaderEl);

    // form container
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(formContainer);

    // preview pane
    previewContainer = slots.preview;
    previewContainer.id = "definition-preview-container";

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

    // wire search → list filter
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

    // clear previous form
    formContainer.innerHTML = "";

    // create new form controller
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

    // move generated subheader into placeholder
    const generatedHeader = formApi.form.querySelector(".modal-subheader");
    if (generatedHeader) {
      subheaderEl.replaceWith(generatedHeader);
      subheaderEl = generatedHeader;

      // update title text to "Add X" or "Edit X"
      const titleEl = subheaderEl.querySelector("h3, .subheading, span");
      if (titleEl) {
        titleEl.textContent = def ? `Edit ${type}` : `Add ${type}`;
      }

      // relocate "Show in filters" checkbox row into subheader
      const filterRow = formApi.form.querySelector(
        '.form-row input[type="checkbox"]'
      )?.closest(".form-row");
      if (filterRow) {
        generatedHeader.append(filterRow);
      }
    }

    // append the form beneath the subheader
    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    // populate or reset form + show preview
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
