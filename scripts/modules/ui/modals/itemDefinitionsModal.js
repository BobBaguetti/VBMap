// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 7   The current file version is 7. Increase by 1 every time you update anything.
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
} from "../../services/itemDefinitionsService.js";  // ← corrected path

/**
 * Initializes the “Manage Items” modal.
 * Returns an object with `open()` and `refresh()` methods.
 */
export function initItemDefinitionsModal(db) {
  // ─── 1) Build modal ─────────────────────────────────────────────────────────
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });
  const header = content.querySelector(".modal-header");

  // ─── 2) Define sorting functions ───────────────────────────────────────────
  const rarityOrder = { legendary:5, epic:4, rare:3, uncommon:2, common:1, "":0 };
  const sortFns = {
    "filter-name":        (a,b) => a.name.localeCompare(b.name),
    "filter-type":        (a,b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a,b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    "filter-description": (a,b) => a.description.localeCompare(b.description),
    "filter-quantity":    (a,b) => (parseInt(b.quantity)||0) - (parseInt(a.quantity)||0),
    "filter-price":       (a,b) => (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
  };
  let activeSorts = new Set();

  // ─── 3) Filter buttons ─────────────────────────────────────────────────────
  const { wrapper: filterWrapper } = createFilterButtonGroup([
    { id: "filter-name",        label: "N"  },
    { id: "filter-type",        label: "T"  },
    { id: "filter-rarity",      label: "R"  },
    { id: "filter-description", label: "D"  },
    { id: "filter-quantity",    label: "Qt" },
    { id: "filter-price",       label: "P"  }
  ], (btnId, isToggled) => {
    if (isToggled) activeSorts.add(btnId);
    else           activeSorts.delete(btnId);
    renderFilteredList();
  });
  header.appendChild(filterWrapper);

  // ─── 4) Search row ─────────────────────────────────────────────────────────
  const { row: searchRow, input: searchInput } =
    createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => {
    renderFilteredList();
  });

  // ─── 5) Definitions list container ─────────────────────────────────────────
  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  // ─── 6) Build Add/Edit form ────────────────────────────────────────────────
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  // Name, Type, Rarity, Desc, Extra Info, Value, Quantity, Image S/L, Buttons
  const { row: rowName, input: fldName } = createTextField("Name:", "def-name");
  form.appendChild(rowName);

  const { row: rowType, select: fldType } =
    createDropdownField("Item Type:", "def-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special"           },
      { value: "Consumable",        label: "Consumable"        },
      { value: "Quest",             label: "Quest"             }
    ]);
  form.appendChild(rowType);

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

  const { row: rowDesc, textarea: fldDesc } =
    createTextareaFieldWithColor("Description:", "def-description");
  form.appendChild(rowDesc);

  const { block: extraBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row extra-row";
  rowExtra.append(
    (() => { const l = document.createElement("label"); l.textContent="Extra Info:"; return l; })(),
    extraBlock
  );
  form.appendChild(rowExtra);

  // Value & Quantity under Extra Info
  const { row: rowValue, input: fldValue } =
    createTextField("Value:", "def-value");
  form.appendChild(rowValue);

  const { row: rowQty, input: fldQty } =
    createTextField("Quantity:", "def-quantity");
  form.appendChild(rowQty);

  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S:", "def-image-small");
  form.appendChild(rowImgS);

  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L:", "def-image-big");
  form.appendChild(rowImgL);

  const rowButtons = createFormButtonRow(() => closeModal(modal));
  form.appendChild(rowButtons);
  content.appendChild(form);

  // ─── 7) State & CRUD handlers ─────────────────────────────────────────────
  let definitions = [];
  let editingId    = null;

  // Fetch all definitions
  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  // Apply active sorts + search filter, then render
  function renderFilteredList() {
    let list = definitions.filter(d =>
      d.name.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    );
    // Apply each active sort in turn
    activeSorts.forEach(id => {
      const fn = sortFns[id];
      if (fn) list = [...list].sort(fn);
    });
    renderList(list);
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.classList.add("item-def-entry");
      entry.innerHTML = `
        <strong>${def.name}</strong> (${def.rarity})<br/>
        Type: ${def.itemType} • Qty: ${def.quantity||"—"} • Value: ${def.value||"—"}
      `;
      entry.addEventListener("click", () => populateForm(def));
      listContainer.appendChild(entry);
    });
  }

  function populateForm(def) {
    editingId        = def.id;
    fldName.value    = def.name;
    fldType.value    = def.itemType;
    fldRarity.value  = def.rarity;
    fldDesc.value    = def.description;
    setLines(def.extraLines||[], false);
    fldValue.value   = def.value    || "";
    fldQty.value     = def.quantity || "";
    fldImgS.value    = def.imageSmall||"";
    fldImgL.value    = def.imageBig  || "";
    subheading.textContent = "Edit Item";
    modal.style.display = "block";
  }

  function clearForm() {
    editingId = null;
    fldName.value= fldType.value= fldRarity.value= fldDesc.value=""
    setLines([],false);
    fldValue.value= fldQty.value= fldImgS.value= fldImgL.value=""
    subheading.textContent="Add Item";
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name:        fldName.value.trim(),
      itemType:    fldType.value,
      rarity:      fldRarity.value,
      description: fldDesc.value.trim(),
      extraLines:  getLines(),
      value:       fldValue.value.trim(),
      quantity:    fldQty.value.trim(),
      imageSmall:  fldImgS.value.trim(),
      imageBig:    fldImgL.value.trim()
    };
    if (editingId) {
      await updateItemDefinition(db, { id: editingId, ...payload });
    } else {
      await saveItemDefinition(db, null, payload);
    }
    closeModal(modal);
    await refreshDefinitions();
  });

  // Delete button
  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = async () => {
    if (!editingId) return;
    await deleteItemDefinition(db, editingId);
    closeModal(modal);
    await refreshDefinitions();
  };
  rowButtons.appendChild(btnDelete);

  // Real‑time subscription
  subscribeItemDefinitions(db, defs => {
    definitions = defs;
    renderFilteredList();
  });

  // ─── 8) API ────────────────────────────────────────────────────────────────
  return {
    open: async () => {
      clearForm();
      await refreshDefinitions();
      modal.style.display = "block";
    },
    refresh: refreshDefinitions
  };
}
