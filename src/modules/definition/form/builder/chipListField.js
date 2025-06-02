// @file: src/modules/definition/form/builder/chipListField.js
// @version: 1.7 — allow dynamic updating of “allItems” via setAllItems()

import { createChipList } from "./chipListManager.js";
import { pickItems }      from "./listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
 *
 * @param {string} labelText
 * @param {Array} initialItems
 * @param {Object} options
 * @param {Array} options.items     — initial “master list” of items to pick from
 * @param {string} options.idKey
 * @param {string} options.labelKey
 * @param {Function} options.renderIcon
 * @param {Function} options.onChange
 * @param {string} options.addBtnContent
 * @param {Object} options.pickOptions
 *
 * @returns {{
 *   row: HTMLElement,
 *   getItems: () => Array,
 *   setItems: (newItems: Array) => void,
 *   setAllItems: (all: Array) => void
 * }}
 */
export function createChipListField(
  labelText,
  initialItems = [],
  {
    items     = [],        // initial “master list” of pickable items
    idKey     = "id",
    labelKey  = "name",
    renderIcon,
    onChange,
    addBtnContent = "⚙️",
    pickOptions   = { size: "large" }
  } = {}
) {
  // 1) Build the form-row container
  const row = document.createElement("div");
  row.className = "form-row";

  // Label cell
  const labelEl = document.createElement("label");
  labelEl.textContent = labelText.endsWith(":")
    ? labelText
    : labelText + ":";
  row.append(labelEl);

  // Chip-list container + add button
  const container = document.createElement("div");
  container.classList.add("chip-list-container");
  const btnAdd = document.createElement("button");
  btnAdd.type      = "button";
  btnAdd.className = "ui-button add-chip-btn";
  btnAdd.textContent = addBtnContent;

  row.append(container, btnAdd);

  // 2) Maintain mutable “master list” and selected items
  let allItems = [...items];
  const listArray = [...initialItems];

  // Initialize chip-list manager
  const chipList = createChipList({
    container,
    listArray,
    renderLabel: item => item[labelKey],
    renderIcon,
    onChange: updated => {
      listArray.splice(0, listArray.length, ...updated);
      onChange?.([...listArray]);
      // trigger form input for live-preview
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    }
  });

  // 3) “Add” button → list-picker
  btnAdd.addEventListener("click", async () => {
    try {
      const selectedIds = await pickItems({
        title:    labelText,
        items:    allItems,
        selected: listArray.map(i => i[idKey]),
        labelKey,
        ...pickOptions
      });
      const picked = allItems.filter(it =>
        selectedIds.includes(it[idKey])
      );
      listArray.splice(0, listArray.length, ...picked);
      chipList.render();
      onChange?.([...listArray]);
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    } catch {
      // user cancelled
    }
  });

  // Allow external injection of the full “master list”
  function setAllItems(newItems) {
    allItems = Array.isArray(newItems) ? [...newItems] : [];
  }

  return {
    row,
    getItems: () => [...listArray],
    setItems: newItems => {
      listArray.splice(0, listArray.length, ...newItems);
      chipList.render();
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    },
    setAllItems
  };
}
