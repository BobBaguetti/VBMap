// @file: src/modules/definition/modal/definitionModal.js
// @version: 1.12 — fix preview to pass full item objects into renderChestPopup

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
        // subscription callback will refresh the list
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

    // If editing/creating a Chest, load all item definitions
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
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        formApi.reset();
        previewApi.hide();
      },
      onFieldChange: data => {
        // For Chest, data.lootPool is an array of full item objects.
        // renderChestPopup can render directly from those objects.
        const pd = data;
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
          // All available items
          const allItems = Object.values(itemMap);
          // Currently selected item IDs
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

            // Map chosen IDs back to full item objects
            const pickedObjects = allItems.filter(i =>
              pickedIds.includes(i.id)
            );
            // Update the chip-list to show chosen items
            formApi.fields.lootPool.set(pickedObjects);

            // Dispatch synthetic input event to update preview
            formApi.form.dispatchEvent(
              new Event("input", { bubbles: true })
            );
          } catch {
            // user cancelled, do nothing
          }
        });
      }
    }

    // Replace the generated subheader (if any)
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

    // Build initial previewData:
    // - For Chest, convert def.lootPool (IDs) → full item objects
    const previewData = def
      ? (type === "Chest"
          ? {
              ...def,
              lootPool: (def.lootPool || [])
                .map(id => itemMap[id])
                .filter(Boolean)  // array of item objects
            }
          : def)
      : (type === "Chest"
          ? { lootPool: [] }   // start with empty array of objects
          : {});
    previewApi.show(previewData);
  }

  return {
    openCreate: (_evt, type = "Item") => openDefinition(type),
    openEdit:   def                   => openDefinition(currentType, def)
  };
}
