// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.19 — pass title & hasFilter to controller, show Add/Edit text, remove manual filter relocation

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

    // Move "Type" selector into header
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

    // Insert search bar
    searchInput = document.createElement("input");
    searchInput.type        = "search";
    searchInput.className   = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.insertBefore(searchInput, closeBtn);

    // Left pane setup
    const leftPane = slots.left;
    leftPane.id = "definition-left-pane";
    const listContainer = createDefListContainer("definition-list");
    leftPane.append(listContainer);

    // Placeholder for form subheader
    subheaderEl = document.createElement("div");
    subheaderEl.className = "modal-subheader";
    leftPane.append(subheaderEl);

    // Form container
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    leftPane.append(formContainer);

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

    // Search → filter
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

    formContainer.innerHTML = "";

    // Pass title and hasFilter to controller so subheader shows title and filter toggle
    formApi = cfg.controller({
      title:        type,
      hasFilter:    true,
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

    // Slot the generated subheader in place of placeholder
    const generatedHeader = formApi.form.querySelector(".modal-subheader");
    if (generatedHeader) {
      subheaderEl.replaceWith(generatedHeader);
      subheaderEl = generatedHeader;

      // Update the Add/Edit text
      const titleEl = generatedHeader.querySelector("h3, .subheading, span");
      if (titleEl) {
        titleEl.textContent = def ? `Edit ${type}` : `Add ${type}`;
      }
    }

    // Append form beneath subheader
    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    // Populate or reset form and show preview
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
