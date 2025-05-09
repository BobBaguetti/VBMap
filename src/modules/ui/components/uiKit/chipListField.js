// @file: src/modules/ui/components/uiKit/chipListField.js
// @version: 1.2 — support custom addBtnContent & centered large modal

import { createFieldRow } from "./fieldKit.js";
import { createChipList }  from "../chipListManager.js";
import { pickItems }       from "../listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
 *
 * @param {string} labelText            – Text for the field label (no trailing colon)
 * @param {Array<object>} initialItems  – Array of item objects to seed the chips
 * @param {object} opts
 * @param {Array<object>} opts.items        – Full list of selectable items
 * @param {string} [opts.idKey="id"]        – Unique-id property name
 * @param {string} [opts.labelKey="name"]   – Property name to show as chip label/picker label
 * @param {function(object):string} [opts.renderIcon] – Fn to return an icon URL per item
 * @param {function(Array<object>):void} [opts.onChange] – Callback on selection change
 * @param {string} [opts.addBtnContent="+"]   – Button content (will default to “⚙️” if not passed)
 * @param {object} [opts.pickOptions={ size:"large" }] – Passthrough to pickItems for positioning
 *
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
    onChange,
    addBtnContent = "⚙️",
    pickOptions   = { size: "large" }
  } = {}
) {
  // build the chip container + add button
  const container = document.createElement("div");
  container.classList.add("chip-list-container");

  const btnAdd = document.createElement("button");
  btnAdd.type        = "button";
  btnAdd.className   = "ui-button add-chip-btn";
  btnAdd.textContent = addBtnContent;

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
      onChange?.([...listArray]);
    }
  });

  // wire the “add” button to open the picker
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
    } catch {
      // cancelled
    }
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
