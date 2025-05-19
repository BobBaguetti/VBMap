// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.5 — always show floating preview after modal opens

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  const { modalEl, open, close } =
    createModalShell("definition-modal");
  let {
    header, searchInput, typeSelect,
    listContainer, subheader, formContainer,
    previewContainer
  } = buildModalUI(modalEl);

  let listApi, formApi, previewApi;
  let currentType;
  let definitions = [];
  let itemMap = {};

  // Fetch & cache definitions for sidebar list
  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  // Wire up the left-hand list & search
  function setupList() {
    listApi = createDefinitionListManager({
      container:    listContainer,
      getDefinitions: () => definitions,
      onEntryClick: def => openDefinition(currentType, def),
      onDelete: async id => {
        await definitionTypes[currentType].del(db, id);
        await refresh();
      }
    });
    searchInput.addEventListener("input", () =>
      listApi.filter(searchInput.value)
    );
  }

  // Core open-modal routine
  async function openDefinition(type, def = null) {
    currentType = type;

    // Type selector
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`)
      .join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    // For chest previews, we need an item lookup
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // Create a fresh preview controller for this type
    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Build the form
    formContainer.innerHTML = "";
    formApi = definitionTypes[type].controller({
      title:     type,
      hasFilter: true,
      onCancel:  () => { formApi.reset(); previewApi.hide(); },
      onDelete:  async id => {
        await definitionTypes[type].del(db, id);
        await refresh();
        formApi.reset();
        previewApi.hide();
      },
      onSubmit:  async payload => {
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        await refresh();
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        let pd = data;
        if (type === "Chest" && Array.isArray(data.lootPool)) {
          pd = {
            ...data,
            lootPool: data.lootPool
              .map(i => itemMap[i])
              .filter(Boolean)
          };
        }
        previewApi.show(pd);
      }
    }, db);

    // Remove duplicate “Show in filters” row if present
    const duplicateFilterRow = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (duplicateFilterRow) duplicateFilterRow.remove();

    // Swap in the generated subheader
    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    subheader = generated;

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    // Populate or reset form fields
    if (def) {
      formApi.populate(def);
    } else {
      formApi.reset();
    }

    // **1) Open the modal (makes .modal-content visible)**
    open();

    // **2) Now show our preview panel (positions it correctly)**
    const previewData = def
      ? (type === "Chest"
          ? {
              ...def,
              lootPool: (def.lootPool || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            }
          : def)
      : (type === "Chest"
          ? { lootPool: [] }
          : {});

    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
