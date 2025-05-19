// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.5 — use consolidated modalCore; removed lifecycle + domBuilder imports

import { createModalCore } from "./modalCore.js";
import { definitionTypes } from "../types.js";
import { createDefinitionListManager }
  from "../list/definitionListManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  // 1) Build modal shell + DOM
  const {
    modalEl, open, close,
    refs: {
      searchInput, typeSelect,
      listContainer, subheader,
      formContainer, previewContainer
    }
  } = createModalCore("definition-modal");

  let listApi, formApi, previewApi, currentType, definitions = [], itemMap = {};

  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container: listContainer,
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

  async function openDefinition(type, def = null) {
    currentType = type;
    // populate type selector
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`).join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    // load extra data for Chest previews
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Build and insert form
    formContainer.innerHTML = "";
    formApi = definitionTypes[type].controller({
      title:     type,
      hasFilter: true,
      onCancel:  () => { formApi.reset(); previewApi.hide(); },
      onDelete:  async id => {
        await definitionTypes[type].del(db, id);
        await refresh();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:  async payload => {
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        await refresh();
        formApi.reset(); previewApi.hide();
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

    // Swap in the generated subheader
    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    subheader = generated;

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) {
      formApi.populate(def);
      previewApi.show(
        type === "Chest"
          ? { ...def, lootPool: (def.lootPool || []).map(i => itemMap[i]).filter(Boolean) }
          : def
      );
    } else {
      formApi.reset();
      previewApi.show(type === "Chest" ? { lootPool: [] } : {});
    }

    open();
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                  => openDefinition(currentType, def)
  };
}
