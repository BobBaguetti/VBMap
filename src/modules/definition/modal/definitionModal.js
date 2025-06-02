// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.12 — fix lootPool ID/object mismatch on populate & save

import { createModalShell } from "./lifecycle.js";
import { buildModalUI }     from "./domBuilder.js";
import { definitionTypes }  from "../types.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { createDefinitionListManager } from "../list/definitionListManager.js";
import { pickItems } from "../form/builder/listPicker.js";

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
  let itemMap = {}; // id → item object for lookups

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

    // If we're editing/creating a Chest, load all items into itemMap
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    } else {
      itemMap = {};
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
        // If Chest, convert lootPool (array of item objects) → [id, …]
        let toSave = { ...payload };
        if (type === "Chest" && Array.isArray(payload.lootPool)) {
          toSave.lootPool = payload.lootPool.map(item => item.id);
        }
        await definitionTypes[type].save(db, toSave.id ?? null, toSave);
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        let pd = data;
        if (type === "Chest" && Array.isArray(data.lootPool)) {
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

    // If this is Chest, wire the Loot Pool “add” button:
    if (type === "Chest") {
      const btnAdd = formApi.form.querySelector(".add-chip-btn");
      if (btnAdd) {
        const newBtn = btnAdd.cloneNode(true);
        btnAdd.parentNode.replaceChild(newBtn, btnAdd);

        newBtn.addEventListener("click", async () => {
          const allItems = Object.values(itemMap);
          const selectedIds = formApi.fields.lootPool
            .get()
            .map(it => it.id);

          try {
            const pickedIds = await pickItems({
              title:    "Loot Pool",
              items:    allItems,
              selected: selectedIds,
              labelKey: "name"
            });

            const pickedObjects = allItems.filter(i =>
              pickedIds.includes(i.id)
            );
            formApi.fields.lootPool.set(pickedObjects);
            formApi.form.dispatchEvent(
              new Event("input", { bubbles: true })
            );
          } catch {
            // user cancelled
          }
        });
      }
    }

    // Insert the newly-built subheader (if any)
    const generated = formApi.form.querySelector(".modal-subheader");
    if (generated && subheader) {
      subheader.replaceWith(generated);
      subheader = generated;
    }

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    // Populate form fields: convert existing lootPool IDs → objects first
    if (def) {
      if (type === "Chest" && Array.isArray(def.lootPool)) {
        const defForForm = {
          ...def,
          lootPool: def.lootPool
            .map(id => itemMap[id])
            .filter(Boolean)
        };
        formApi.populate(defForForm);
      } else {
        formApi.populate(def);
      }
    } else {
      formApi.reset();
    }

    open();

    // Show preview immediately (for Chest, translate lootPool IDs → objects)
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
