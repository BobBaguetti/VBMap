// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.9 — defer Pickr init (no args) and let populate() set saved colors

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

  let listApi, formApi, previewApi;
  let currentType;
  let definitions = [];
  let itemMap = {};

  // Hide preview on modal close
  modalEl.addEventListener("close", () => previewApi?.hide());

  // Switch types
  typeSelect.addEventListener("change", () =>
    openDefinition(typeSelect.value)
  );

  async function refresh() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   d => openDefinition(currentType, d),
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
    // rebuild selector
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`).join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // preview
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

    // remove stray filter row
    const dup = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (dup) dup.remove();

    // swap in subheader
    const gen = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(gen);
    subheader = gen;

    formContainer.append(formApi.form);

    // ─── ONLY initialize pickrs once, with no initialColors arg ─────────────
    formApi.initPickrs();

    // populate (or reset) will now set each Pickr from def[colorKey]
    if (def) {
      formApi.populate(def);
    } else {
      formApi.reset();
    }

    // open and show preview
    open();
    const previewData = def
      ? (type === "Chest"
          ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
          : def)
      : (type==="Chest" ? { lootPool: [] } : {});
    previewApi.show(previewData);
  }

  return {
    openCreate: (_e, t = "Item") => openDefinition(t),
    openEdit:    d              => openDefinition(currentType, d)
  };
}
