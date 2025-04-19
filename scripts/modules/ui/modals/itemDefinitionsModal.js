// @version: 2
// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js

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
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

/**
 * Initializes the “Manage Items” modal.
 * Returns an object with `open()` and `refresh()` methods.
 */
export function initItemDefinitionsModal(db) {
  // 1) Create a large, static modal with dark backdrop and divider
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  // 2) Grab the header element to append our controls
  const header = content.querySelector(".modal-header");

  // 3) Filter‐button group (N, T, R, D, Qt, P)
  const { wrapper: filterWrapper } = createFilterButtonGroup([
    { id: "filter-name",        label: "N"  },
    { id: "filter-type",        label: "T"  },
    { id: "filter-rarity",      label: "R"  },
    { id: "filter-description", label: "D"  },
    { id: "filter-quantity",    label: "Qt" },
    { id: "filter-price",       label: "P"  }
  ], (btnId, isToggled) => {
    // TODO: implement your filter logic here, e.g. sort or hide items
    applyDefinitionFilter(btnId, isToggled);
  });
  header.appendChild(filterWrapper);

  // 4) Search row
  const { row: searchRow, input: searchInput } =
    createSearchRow("def-search", "Search...");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => {
    applySearchFilter(searchInput.value);
  });

  // 5) Definitions list container
  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);

  // 6) Separator
  content.appendChild(document.createElement("hr"));

  // 7) Form for add/edit
  const form = document.createElement("form");
  form.id = "item-definition-form";
  // Subheading
  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "def-name");
  rowName.classList.add("field-row");
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
  const {
    block: extraBlock,
    getLines: getExtraLines,
    setLines: setExtraLines
  } = createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row extra-row";
  const lblExtra = document.createElement("label");
  lblExtra.textContent = "Extra Info:";
  rowExtra.append(lblExtra, extraBlock);
  form.appendChild(rowExtra);

  // — Image S —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S:", "def-image-small");
  form.appendChild(rowImgS);

  // — Image L —
  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L:", "def-image-big");
  form.appendChild(rowImgL);

  // — Quantity & Price (custom fields) —
  const { row: rowQty, input: fldQty } =
    createTextField("Quantity:", "def-quantity");
  form.appendChild(rowQty);

  const { row: rowPrice, input: fldPrice } =
    createTextField("Price:", "def-price");
  form.appendChild(rowPrice);

  // — Save/Cancel —
  const rowButtons = createFormButtonRow(() => closeModal(modal));
  form.appendChild(rowButtons);
  content.appendChild(form);

  // 8) Internal helpers & state
  let definitions = [];
  let editingId = null;

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderList(definitions);
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.classList.add("item-def-entry");
      entry.innerHTML = `
        <strong>${def.name}</strong> (${def.rarity})<br/>
        Type: ${def.itemType} • Qty: ${def.quantity || "—"} • Price: ${def.price || "—"}
      `;
      entry.addEventListener("click", () => populateForm(def));
      listContainer.appendChild(entry);
    });
  }

  function populateForm(def) {
    editingId = def.id;
    fldName.value        = def.name;
    fldType.value        = def.itemType;
    fldRarity.value      = def.rarity;
    fldDesc.value        = def.description;
    setExtraLines(def.extraLines || [], false);
    fldImgS.value        = def.imageSmall || "";
    fldImgL.value        = def.imageBig   || "";
    fldQty.value         = def.quantity   || "";
    fldPrice.value       = def.price      || "";
    subheading.textContent = "Edit Item";
    openModal();
  }

  function clearForm() {
    editingId = null;
    fldName.value = "";
    fldType.value = "";
    fldRarity.value = "";
    fldDesc.value = "";
    setExtraLines([], false);
    fldImgS.value = "";
    fldImgL.value = "";
    fldQty.value = "";
    fldPrice.value = "";
    subheading.textContent = "Add Item";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: fldName.value.trim(),
      itemType: fldType.value,
      rarity: fldRarity.value,
      description: fldDesc.value.trim(),
      extraLines: getExtraLines(),
      imageSmall: fldImgS.value.trim(),
      imageBig: fldImgL.value.trim(),
      quantity: fldQty.value.trim(),
      price: fldPrice.value.trim()
    };
    if (editingId) {
      await saveItemDefinition(db, editingId, payload);
    } else {
      await saveItemDefinition(db, null, payload);
    }
    closeModal(modal);
    await refreshDefinitions();
  }

  async function handleDeleteCurrent() {
    if (editingId) {
      await deleteItemDefinition(db, editingId);
      closeModal(modal);
      await refreshDefinitions();
    }
  }

  form.addEventListener("submit", handleSubmit);

  // Add a “Delete” button next to the form’s Cancel
  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = handleDeleteCurrent;
  rowButtons.appendChild(btnDelete);

  function openModal() {
    clearForm();               // if opening fresh
    modal.style.display = "block";
  }

  function applyDefinitionFilter(btnId, toggled) {
    // implement your sort/filter logic here...
  }

  function applySearchFilter(query) {
    const q = query.trim().toLowerCase();
    renderList(definitions.filter(d => d.name.toLowerCase().includes(q)));
  }

  // 9) Return API
  return {
    open: async () => {
      clearForm();
      await refreshDefinitions();
      openModal();
    },
    refresh: refreshDefinitions
  };
}
