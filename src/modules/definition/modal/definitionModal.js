// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.7 — force-sync swatch buttons after populate

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

    // Rebuild type selector
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

    // Recreate preview controller
    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Build form
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

    // Remove any stray showInFilters row
    const dup = formApi.form
      .querySelector('#fld-showInFilters')
      ?.closest('.field-row');
    if (dup) dup.remove();

    // Swap in generated subheader
    const generated = formApi.form.querySelector(".modal-subheader");
    subheader.replaceWith(generated);
    subheader = generated;

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) {
      formApi.populate(def);

      // ─── New: Force-sync swatch buttons to saved colors ──────────
      Object.entries(formApi.pickrs).forEach(([key, p]) => {
        const saved = def[key];
        if (saved) {
          p.setColor(saved);
          if (p._swatchEl) {
            p._swatchEl.style.backgroundColor = saved;
          }
        }
      });
    } else {
      formApi.reset();
    }

    // Open and show preview
    open();
    const previewData = def
      ? (type === "Chest"
          ? { ...def, lootPool: (def.lootPool || []).map(id => itemMap[id]).filter(Boolean) }
          : def)
      : (type === "Chest" ? { lootPool: [] } : {});
    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, t = "Item") => openDefinition(t),
    openEdit:   def              => openDefinition(currentType, def)
  };
}
