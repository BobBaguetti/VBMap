// @file: src/modules/definition/form/builder/chipListField.js
// @version: 1.6 — avoid recursion by not using createFieldRow

import { createChipList } from "./chipListManager.js";
import { pickItems }      from "./listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
 *
 * @param {string} labelText
 * @param {Array} initialItems
 * @param {Object} options
 * @param {Array} options.items
 * @param {string} options.idKey
 * @param {string} options.labelKey
 * @param {Function} options.renderIcon
 * @param {Function} options.onChange
 * @param {string} options.addBtnContent
 * @param {Object} options.pickOptions
 */
export function createChipListField(
  labelText,
  initialItems = [],
  {
    items: allItems = [],
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

  // 2) Initialize chip-list manager
  const listArray = [...initialItems];
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

  return {
    row,
    getItems: () => [...listArray],
    setItems: newItems => {
      listArray.splice(0, listArray.length, ...newItems);
      chipList.render();
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    }
  };
}
