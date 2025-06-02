// @file: src/modules/definition/form/builder/chipListField.js
// @version: 1.7 — keep `listArray` as IDs, but render chips via lookup in `allItems`

import { createChipList } from "./chipListManager.js";
import { pickItems }      from "./listPicker.js";

/**
 * Creates a labeled chip-list field with an “add” button that opens the list-picker.
 *
 * Internally, this stores only an array of ID strings—but it still shows
 * labels/icons by looking up each ID in the full `allItems` array.
 *
 * @param {string} labelText
 * @param {Array<string>} initialItems  — array of IDs (e.g. ["iron123","gold456"])
 * @param {Object} options
 * @param {Array<object>} options.items     — full array of {id, name, imageSmall, …}
 * @param {string} [options.idKey="id"]
 * @param {string} [options.labelKey="name"]
 * @param {Function} [options.renderIcon] — (itemObj) ⇒ returns image URL
 * @param {Function} [options.onChange]   — called with updated array of IDs
 * @param {string} [options.addBtnContent="⚙️"]
 * @param {Object} [options.pickOptions]  — passed into pickItems
 *
 * @returns {{
 *   row: HTMLElement,
 *   getItems: () => string[],   // returns array of IDs
 *   setItems: (ids: string[]) => void  // sets the list of IDs
 * }}
 */
export function createChipListField(
  labelText,
  initialItems = [], // array of IDs
  {
    items: allItems = [],   // full objects
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

  // 2) Internally, listArray holds ID strings
  const listArray = [...initialItems]; // e.g. ["iron123", ...]
  // When rendering chips, we need a label/icon for each ID:
  function lookupObject(id) {
    return allItems.find(obj => obj[idKey] === id) || { [labelKey]: id, imageSmall: "" };
  }

  // Create the chip manager: render each chip by looking up full object.
  const chipList = createChipList({
    container,
    listArray,
    renderLabel: id => {
      const obj = lookupObject(id);
      return obj[labelKey] || id;
    },
    renderIcon: id => {
      const obj = lookupObject(id);
      return renderIcon ? renderIcon(obj) : undefined;
    },
    onChange: updatedIds => {
      // updatedIds is an array of ID strings
      listArray.splice(0, listArray.length, ...updatedIds);
      onChange?.([...listArray]);
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    }
  });

  // 3) “Add” button → list-picker. We pass full objects; picker returns IDs.
  btnAdd.addEventListener("click", async () => {
    try {
      const selectedIds = await pickItems({
        title:    labelText,
        items:    allItems,         // full objects
        selected: listArray,        // array of IDs (picker will mark these checked)
        labelKey,
        ...pickOptions
      });
      // selectedIds is an array of ID strings. We store only IDs:
      listArray.splice(0, listArray.length, ...selectedIds);
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
    getItems: () => [...listArray],     // returns array of IDs
    setItems: newIds => {
      listArray.splice(0, listArray.length, ...newIds);
      chipList.render();
      row.closest("form")?.dispatchEvent(
        new Event("input", { bubbles: true })
      );
      onChange?.([...listArray]);
    }
  };
}
