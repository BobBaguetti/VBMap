// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.0 — orchestrates Definition modal, uses lifecycle & UI builder

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { createDefinitionListManager } 
  from "../list/definitionListManager.js";
import { createFormControllerHeader, wireFormEvents }
  from "../../../shared/ui/forms/formControllerShell.js";
import { initFormPickrs } from "../../../shared/ui/forms/pickrAdapter.js";
import { createFormState } from "../../../shared/ui/forms/formStateManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  const { modalEl, open, close } = createModalShell("definition-modal");
  const {
    header, searchInput, typeSelect,
    listContainer, subheader, formContainer,
    previewContainer
  } = buildModalUI(modalEl);

  let listApi, formApi, previewApi, currentType, definitions = [], itemMap = {};

  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container: listContainer,
      getDefinitions: () => definitions,
      onEntryClick: openDefinition,
      onDelete: async id => {
        await definitionTypes[currentType].del(db, id);
        await refresh();
      }
    });
    searchInput.addEventListener("input", () => 
      listApi.filter(searchInput.value)
    );
  }

  async function openDefinition(type, def = null) {
    currentType = type;
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`).join("");
    typeSelect.value = type;
    await refresh();

    if (!listApi) setupList();

    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Build form
    formContainer.innerHTML = "";
    formApi = definitionTypes[type].controller({
      title: type,
      hasFilter: true,
      onCancel: () => { formApi.reset(); previewApi.hide(); },
      onDelete: async id => { /* ... */ },
      onSubmit: async payload => { /* ... */ },
      onFieldChange: data => { /* ... */ }
    }, db);

    // Replace placeholder header
    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) formApi.populate(def);
    else formApi.reset();

    open();
  }

  return { openCreate: (_evt, type="Item") => openDefinition(type) };
}
