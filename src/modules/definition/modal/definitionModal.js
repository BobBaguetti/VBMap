// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.12 — refactor loot-pool code into a reusable helper

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { createDefinitionListManager } from "../list/definitionListManager.js";

import { chestSchema } from "../schemas/chestSchema.js";
import { npcSchema }   from "../schemas/npcSchema.js";

////////////////////////////////////////////////////////////////////////////////
// ─── HELPER: prepareLootPoolForType() ────────────────────────────────────────
//
// If the schema for this definition type has a `lootPool` field, we:
//
// 1) load *all* item definitions (so the chip-list “Add” button will show them),  
// 2) set `schema.lootPool.items = items`,  
// 3) build an `itemMap` for preview/popup so `id → full item object`.
//
// We return that `itemMap` so the caller can map IDs → objects on populate/preview.
////////////////////////////////////////////////////////////////////////////////
async function prepareLootPoolForType(type, db) {
  // Grab the schema corresponding to this type
  const schema = definitionTypes[type].schema;

  // Only proceed if the schema actually has a lootPool field
  if (!schema.lootPool) {
    return {};
  }

  // 1) Fetch the full array of Item definitions
  const items = await loadItemDefinitions(db);

  // 2) Mutate the schema so that buildForm(schema) picks up `items`
  schema.lootPool.items = items;

  // 3) Build and return an `id → object` map
  return Object.fromEntries(items.map(i => [i.id, i]));
}

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

  // This will hold the `id → full item` map for preview/enrichment
  let itemMap = {};

  // Hide preview whenever the modal closes
  modalEl.addEventListener("close", () => {
    if (previewApi) previewApi.hide();
    if (definitionsUnsub) {
      definitionsUnsub();
      definitionsUnsub = null;
    }
  });

  // Reopen on type change
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
        // subscription will refresh
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

    // ─── REUSABLE LOOT-POOL LOGIC ────────────────────────────────────────────
    // If this type’s schema has a lootPool, load items and inject into schema.
    itemMap = await prepareLootPoolForType(type, db);
    // ──────────────────────────────────────────────────────────────────────────

    previewApi = definitionTypes[type].previewBuilder(previewContainer);

    // Clear any existing form, then build a fresh one
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
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        let pd = data;

        // If this schema had a lootPool and the fieldChange gives us IDs, convert them to full objects
        if (definitionTypes[type].schema.lootPool && Array.isArray(data.lootPool)) {
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

    // Replace the autogenerated subheader element for consistency
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

    // First show: either existing def (with enrichment) or an empty-template
    const previewData = def
      ? {
          ...def,
          lootPool: (def.lootPool || [])
            .map(id => itemMap[id])
            .filter(Boolean)
        }
      : { lootPool: [] };
    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
