// @file: src/modules/ui/components/uiKit/chipListField.js
// @version: 1.0 — unified chip-list + picker field

import { createFieldRow } from "./fieldKit.js";
import { createChipList }    from "../chipListManager.js";
import { pickItems }         from "../listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
 *
 * @param {string} labelText              – text for the field label (no trailing colon needed)
 * @param {Array<object>} initialItems    – array of item objects to seed the chips
 * @param {object} opts
 * @param {Array<object>} opts.items        – full list of selectable items (each must have an `id` and e.g. a `name`)
 * @param {string} [opts.idKey="id"]        – property name to use as the unique id
 * @param {string} [opts.labelKey="name"]   – property name to use for chip labels / picker labels
 * @param {function(object):string} [opts.renderIcon] – (optional) fn to return an icon URL for a chip
 * @param {function(Array<object>):void} [opts.onChange] – callback whenever the selected items change
 * @returns {{
 *   row: HTMLElement,
 *   getItems: () => Array<object>,
 *   setItems: (Array<object>) => void
 * }}
 */
export function createChipListField(
  labelText,
  initialItems = [],
  {
    items: allItems = [],
    idKey     = "id",
    labelKey  = "name",
    renderIcon,
    onChange
  } = {}
) {
  // build the chip container + add button
  const container = document.createElement("div");
  container.classList.add("chip-list-container");

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.className = "ui-button add-chip-btn";
  btnAdd.textContent = "+";

  // wrap in a field-row
  const row = createFieldRow(labelText, container);
  row.append(btnAdd);

  // backing array and render logic
  const listArray = [...initialItems];
  const chipList = createChipList({
    container,
    listArray,
    renderLabel: item => item[labelKey],
    renderIcon,
    onChange: updated => {
      listArray.splice(0, listArray.length, ...updated);
      if (onChange) onChange([...listArray]);
    }
  });

  // wire the “+” button to open the picker
  btnAdd.addEventListener("click", () => {
    pickItems({
      title: labelText,
      items: allItems,
      selected: listArray.map(i => i[idKey]),
      labelKey
    })
      .then(selectedIds => {
        // map ids back to full objects
        const picked = allItems.filter(it => selectedIds.includes(it[idKey]));
        listArray.splice(0, listArray.length, ...picked);
        chipList.render();
        if (onChange) onChange([...listArray]);
      })
      .catch(() => {
        /* user cancelled */
      });
  });

  return {
    row,
    getItems: () => [...listArray],
    setItems: newItems => {
      listArray.splice(0, listArray.length, ...newItems);
      chipList.render();
    }
  };
}
