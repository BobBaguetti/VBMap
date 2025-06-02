// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.12 — ensure lootPool saves as ID array

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { createDefinitionListManager } from "../list/definitionListManager.js";

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
  let definitionsUnsub = null;
  let itemMap = {};

  modalEl.addEventListener("close", () => {
    if (previewApi) previewApi.hide();
    if (definitionsUnsub) {
      definitionsUnsub();
      definitionsUnsub = null;
    }
  });

  typeSelect.addEventListener("change", () => {
    openDefinition(typeSelect.value);
  });

  function bindDefinitionUpdates(type) {
    if (definitionsUnsub) {
      definitionsUnsub();
      definitionsUnsub = null;
    }
    const { subscribeDefinitions } = definitionTypes[type];
    if (typeof subscribeDefinitions === "function") {
      definitionsUnsub = subscribeDefinitions(db, defs => {
        definitions = defs;
        listApi.refresh(definitions);
      });
    }
  }

  function setupList() {
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete:       async id => {
        if (!confirm("Are you sure you want to delete this definition?")) {
          return;
        }
        await definitionTypes[currentType].del(db, id);
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
    bindDefinitionUpdates(type);

    // ─── For Chest & NPC, load items and inject just once into schema.lootPool.options ───
    if (type === "Chest" || type === "NPC") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
      // We only need each ID in the final saved doc; but at build time we hand full objects
      // to the picker. So we store the full array here in schema.lootPool.options:
      definitionTypes[type].schema.lootPool.options = items;
    }

    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    formContainer.innerHTML = "";
    formApi = definitionTypes[type].controller({
      title:     type,
      hasFilter: true,
      onCancel:  () => { formApi.reset(); previewApi.hide(); },
      onDelete:  async id => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) {
          return;
        }
        await definitionTypes[type].del(db, id);
        formApi.reset();
        previewApi.hide();
      },
      onSubmit:  async payload => {
        // ─── CONVERT full-item‐objects → ID strings if present ───
        if (type === "Chest" && Array.isArray(payload.lootPool)) {
          // payload.lootPool might currently be [ {id: "...", ...}, ... ]
          // Convert to [ "id1", "id2", ... ] before saving:
          payload.lootPool = payload.lootPool.map(itemObj =>
            typeof itemObj === "string" ? itemObj : itemObj.id
          );
        }
        if (type === "NPC" && Array.isArray(payload.lootPool)) {
          payload.lootPool = payload.lootPool.map(itemObj =>
            typeof itemObj === "string" ? itemObj : itemObj.id
          );
        }
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        let pd = data;
        // For preview, translate IDs → full objects
        if ((type === "Chest" || type === "NPC") && Array.isArray(data.lootPool)) {
          pd = {
            ...data,
            lootPool: data.lootPool.map(i => itemMap[i]).filter(Boolean)
          };
        }
        previewApi.show(pd);
      }
    }, db);

    const generated = formApi.form.querySelector(".modal-subheader");
    if (generated && subheader) {
      subheader.replaceWith(generated);
      subheader = generated;
    }

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) {
      formApi.populate(def);
    } else {
      formApi.reset();
    }

    open();

    // Build initial preview data:
    let previewData = {};
    if (def) {
      if (type === "Chest" || type === "NPC") {
        previewData = {
          ...def,
          lootPool: (def.lootPool || []).map(id => itemMap[id]).filter(Boolean)
        };
      } else {
        previewData = def;
      }
    } else {
      if (type === "Chest" || type === "NPC") {
        previewData = { lootPool: [] };
      }
    }
    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
