// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.8 — direct swatch-sync using schema colorable props

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
    typeSelect.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option>${t}</option>`).join("");
    typeSelect.value = type;

    if (!listApi) setupList();
    await refresh();

    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    previewApi = definitionTypes[type].previewBuilder(previewContainer);

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

    const dup = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (dup) dup.remove();

    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    subheader = generated;

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) {
      formApi.populate(def);

      // ─── New: direct swatch sync from schema ─────────────────────────────
      const schema = definitionTypes[type].schema;
      Object.entries(schema).forEach(([fieldKey, cfg]) => {
        if (cfg.colorable) {
          const colorProp = cfg.colorable;            // e.g. "nameColor"
          const saved     = def[colorProp];           // e.g. "#ff00aa"
          const btn = formApi.form.querySelector(
            `#fld-${fieldKey}-color`
          );
          if (saved && btn) {
            btn.style.backgroundColor = saved;
          }
        }
      });
    } else {
      formApi.reset();
    }

    open();
    const previewData = def
      ? (type === "Chest"
          ? { ...def, lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean) }
          : def)
      : (type === "Chest" ? { lootPool: [] } : {});
    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, t="Item") => openDefinition(t),
    openEdit:   def             => openDefinition(currentType, def)
  };
}
