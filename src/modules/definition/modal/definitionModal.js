// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.7 — ensure previewData includes all colorable fields with defaults

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

  // allow switching types on the fly
  typeSelect.addEventListener("change", () => {
    openDefinition(typeSelect.value);
  });

  let listApi, formApi, previewApi;
  let currentType;
  let definitions = [];
  let itemMap = {};

  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete:       async id => {
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

    // rebuild type selector
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`)
      .join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // reset preview controller
    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // build form
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
        // ensure all colorable props exist
        const schema = definitionTypes[type].schema;
        Object.values(schema)
          .filter(cfg => cfg.colorable)
          .forEach(cfg => {
            if (pd[cfg.colorable] === undefined) pd[cfg.colorable] = "";
          });

        previewApi.show(pd);
      }
    }, db);

    // remove duplicate filter row
    const duplicateFilterRow = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (duplicateFilterRow) duplicateFilterRow.remove();

    // swap subheader
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

    // prepare previewData
    const base = def
      ? (type === "Chest"
          ? { ...def, lootPool: (def.lootPool || []).map(id => itemMap[id]).filter(Boolean) }
          : def)
      : (type === "Chest" ? { lootPool: [] } : {});

    // default missing color fields
    const schema = definitionTypes[type].schema;
    Object.values(schema)
      .filter(cfg => cfg.colorable)
      .forEach(cfg => {
        if (base[cfg.colorable] === undefined) base[cfg.colorable] = "";
      });

    // show preview
    previewApi.show(base);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
