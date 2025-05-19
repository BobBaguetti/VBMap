// @file: src/modules/definition/form/builder/chipListField.js
// @version: 1.5 — fixed imports for relocated helpers

import { createFieldRow } from "./fieldRow.js";
import { createChipList } from "./chipListManager.js";
import { pickItems }      from "./listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
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
  // 1) build DOM
  const container = document.createElement("div");
  container.classList.add("chip-list-container");

  const btnAdd = document.createElement("button");
  btnAdd.type        = "button";
  btnAdd.className   = "ui-button add-chip-btn";
  btnAdd.textContent = addBtnContent;

  // Use createFieldRow to build the labeled row
  const { row } = createFieldRow({
    type:       "chipList",
    label:      labelText,
    idKey,
    labelKey,
    renderIcon
  });

  row.append(container, btnAdd);

  // 2) chip-list manager
  const listArray = [...initialItems];
  const chipList = createChipList({
    container,
    listArray,
    renderLabel: item => item[labelKey],
    renderIcon,
    onChange: updated => {
      // sync backing array
      listArray.splice(0, listArray.length, ...updated);
      onChange?.([...listArray]);
      // fire form input for live-preview
      row.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  // 3) “add” button → picker
  btnAdd.addEventListener("click", async () => {
    try {
      const selectedIds = await pickItems({
        title:    labelText,
        items:    allItems,
        selected: listArray.map(i => i[idKey]),
        labelKey,
        ...pickOptions
      });
      const picked = allItems.filter(it => selectedIds.includes(it[idKey]));
      listArray.splice(0, listArray.length, ...picked);
      chipList.render();
      onChange?.([...listArray]);
      row.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
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
      row.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
}
