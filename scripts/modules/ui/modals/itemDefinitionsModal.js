// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 5   The current file version is 5. Increase by 1 every time you update anything.
// @file:    /scripts/modules/ui/modals/itemDefinitionsModal.js

import {
  createModal,
  closeModal
} from "../uiKit.js";

import {
  createFilterButtonGroup,
  createSearchRow,
  createDefListContainer,
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../modules/services/itemDefinitionsService.js";

/**
 * Initializes the “Manage Items” modal.
 * Returns an object with `open()` and `refresh()` methods.
 */
export function initItemDefinitionsModal(db) {
  // 1) Create a large, static modal with dark backdrop & divider
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  // 2) Header controls
  const header = content.querySelector(".modal-header");

  // 2a) Filter buttons
  const { wrapper: filterWrapper } = createFilterButtonGroup([
    { id: "filter-name",        label: "N"  },
    { id: "filter-type",        label: "T"  },
    { id: "filter-rarity",      label: "R"  },
    { id: "filter-description", label: "D"  },
    { id: "filter-quantity",    label: "Qt" },
    { id: "filter-value",       label: "P"  }
  ], (btnId, isToggled) => {
    applyDefinitionFilter(btnId, isToggled);
  });
  header.appendChild(filterWrapper);

  // 2b) Search row
  const { row: searchRow, input: searchInput } =
    createSearchRow("def-search", "Search...");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => {
    applySearchFilter(searchInput.value);
  });

  // 3) Definitions list
  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);

  // 4) Separator
  content.appendChild(document.createElement("hr"));

  // 5) Form (add/edit)
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "def-name");
  form.appendChild(rowName);

  // — Item Type —
  const { row: rowType, select: fldType } =
    createDropdownField("Item Type:", "def-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special"           },
      { value: "Consumable",        label: "Consumable"        },
      { value: "Quest",             label: "Quest"             }
    ]);
  form.appendChild(rowType);

  // — Rarity —
  const { row: rowRarity, select: fldRarity } =
    createDropdownField("Rarity:", "def-rarity", [
      { value: "",          label: "Select Rarity" },
      { value: "common",    label: "Common"         },
      { value: "uncommon",  label: "Uncommon"       },
      { value: "rare",      label: "Rare"           },
      { value: "epic",      label: "Epic"           },
      { value: "legendary", label: "Legendary"      }
    ]);
  form.appendChild(rowRarity);

  // — Description —
  const { row: rowDesc, textarea: fldDesc } =
    createTextareaFieldWithColor("Description:", "def-description");
  form.appendChild(rowDesc);

  // — Extra Info —
  const { block: extraBlock, getLines, setLines } =
    createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row extra-row";
  const lblExtra = document.createElement("label");
  lblExtra.textContent = "Extra Info:";
  rowExtra.append(lblExtra, extraBlock);
  form.appendChild(rowExtra);

  // — Value (sell price) — immediately below Extra Info
  const { row: rowValue, input: fldValue } =
    createTextField("Value:", "def-value");
  form.appendChild(rowValue);

  // — Quantity — immediately below Value
  const { row: rowQty, input: fldQty } =
    createTextField("Quantity:", "def-quantity");
  form.appendChild(rowQty);

  // — Image S & L —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S:", "def-image-small");
  form.appendChild(rowImgS);

  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L:", "def-image-big");
  form.appendChild(rowImgL);

  // — Save/Cancel & Delete buttons —
  const rowButtons = createFormButtonRow(() => closeModal(modal));
  form.appendChild(rowButtons);

  content.appendChild(form);

  // 6) State & helpers
  let definitions = [];
  let editingId = null;
  let unsubscribe = null;

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderList(definitions);
  }

  function startSubscription() {
    unsubscribe = subscribeItemDefinitions(db, defs => {
      definitions = defs;
      renderList(defs);
    });
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.classList.add("item-def-entry");
      entry.innerHTML = `
        <strong>${def.name}</strong> (${def.rarity})<br/>
        Type: ${def.itemType} • Qty: ${def.quantity || "—"} • Value: ${def.value || "—"}
      `;
      entry.addEventListener("click", () => populateForm(def));
      listContainer.appendChild(entry);
    });
  }

  function populateForm(def) {
    editingId = def.id;
    fldName.value    = def.name;
    fldType.value    = def.itemType;
    fldRarity.value  = def.rarity;
    fldDesc.value    = def.description;
    setLines(def.extraLines || [], false);
    fldValue.value   = def.value      || "";
    fldQty.value     = def.quantity   || "";
    fldImgS.value    = def.imageSmall || "";
    fldImgL.value    = def.imageBig   || "";
    subheading.textContent = "Edit Item";
    openModal();
  }

  function clearForm() {
    editingId        = null;
    fldName.value    = "";
    fldType.value    = "";
    fldRarity.value  = "";
    fldDesc.value    = "";
    setLines([], false);
    fldValue.value   = "";
    fldQty.value     = "";
    fldImgS.value    = "";
    fldImgL.value    = "";
    subheading.textContent = "Add Item";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name:         fldName.value.trim(),
      itemType:     fldType.value,
      rarity:       fldRarity.value,
      description:  fldDesc.value.trim(),
      extraLines:   getLines(),
      value:        fldValue.value.trim(),
      quantity:     fldQty.value.trim(),
      imageSmall:   fldImgS.value.trim(),
      imageBig:     fldImgL.value.trim()
    };
    // use save for create or full overwrite
    await saveItemDefinition(db, editingId, payload);
    closeModal(modal);
    // subscription will push updated list
  }

  async function handleDelete() {
    if (editingId) {
      await deleteItemDefinition(db, editingId);
      closeModal(modal);
      // subscription will push updated list
    }
  }

  form.addEventListener("submit", handleSubmit);

  // Delete button
  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = handleDelete;
  rowButtons.appendChild(btnDelete);

  function openModal() {
    clearForm();
    if (!unsubscribe) startSubscription();
    modal.style.display = "block";
  }

  function applyDefinitionFilter(btnId, toggled) {
    // TODO: filter/sort logic
  }

  function applySearchFilter(query) {
    const q = query.trim().toLowerCase();
    renderList(definitions.filter(d => d.name.toLowerCase().includes(q)));
  }

  // 7) API
  return {
    open: openModal,
    refresh: refreshDefinitions,
    unsubscribe
  };
}
