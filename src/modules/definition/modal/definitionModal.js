// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.6 — support changing definition type on the fly

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  const { modalEl, open, close } = createModalShell("definition-modal");
  let {
    header, searchInput, typeSelect,
    listContainer, subheader, formContainer,
    previewContainer
  } = buildModalUI(modalEl);

  // When the user picks a different type, reopen the modal for that type
  typeSelect.addEventListener("change", () => {
    openDefinition(typeSelect.value);
  });

  let listApi, formApi, previewApi;
  let currentType;
  let definitions = [];
  let itemMap = {};

  // Load & refresh the list for the current type
  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  // Initialize the sidebar list only once
  function setupList() {
    listApi = createDefinitionListManager({
      container:       listContainer,
      getDefinitions:  () => definitions,
      onEntryClick:    def => openDefinition(currentType, def),
      onDelete:        async id => {
        await definitionTypes[currentType].del(db, id);
        await refresh();
      }
    });
    searchInput.addEventListener("input", () =>
      listApi.filter(searchInput.value)
    );
  }

  // Main open routine
  async function openDefinition(type, def = null) {
    currentType = type;

    // Rebuild type selector options and set value
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`)
      .join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    // For Chest definitions we need to load items for lootPool
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // Reset and recreate the preview controller
    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Build the form UI
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
            lootPool: data.lootPool.map(i => itemMap[i]).filter(Boolean)
          };
        }
        previewApi.show(pd);
      }
    }, db);

    // Remove any stray showInFilters row from the form body
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

    // Populate or reset fields
    if (def) {
      formApi.populate(def);
    } else {
      formApi.reset();
    }

    // Open modal and immediately show the preview (even if empty)
    open();

    const previewData = def
      ? (type === "Chest"
          ? {
              ...def,
              lootPool: (def.lootPool || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            }
          : def)
      : (type === "Chest" ? { lootPool: [] } : {});

    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
