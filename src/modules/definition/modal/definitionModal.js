// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.6 — preserve original def on live‐preview updates

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
  let baseDef = {};       // will hold the original def for merges

  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container:       listContainer,
      getDefinitions:  () => definitions,
      onEntryClick:    def => openDefinition(currentType, def),
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
    // reset baseDef
    baseDef = {};

    // populate type selector
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`)
      .join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    // load items for Chest mapping
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // instantiate a fresh preview controller
    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // capture the “original” def with full shape
    if (def) {
      if (type === "Chest") {
        baseDef = {
          ...def,
          lootPool: (def.lootPool || [])
            .map(id => itemMap[id])
            .filter(Boolean)
        };
      } else {
        baseDef = { ...def };
      }
    }

    // build & wire the form
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
        // merge edits onto the original definition
        let pd = { ...baseDef, ...data };

        // for Chest, remap lootPool ids → full items
        if (type === "Chest" && Array.isArray(data.lootPool)) {
          pd.lootPool = data.lootPool
            .map(id => itemMap[id])
            .filter(Boolean);
        }

        previewApi.show(pd);
      }
    }, db);

    // remove the duplicate “Show in Filters” row if it sneaks in
    const duplicateFilterRow = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (duplicateFilterRow) duplicateFilterRow.remove();

    // swap in the form’s generated header
    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    subheader = generated;

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    // populate or reset
    if (def) {
      formApi.populate(def);
    } else {
      formApi.reset();
    }

    // open modal
    open();

    // show preview immediately, merging in defaults if needed
    const initialPreview = def
      ? baseDef
      : (type === "Chest"
          ? { lootPool: [] }
          : {});
    previewApi.show(initialPreview);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
