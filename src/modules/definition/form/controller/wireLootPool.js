// @file: src/modules/definition/form/controller/wireLootPool.js
// @version: 1.0 — shared “lootPool” wiring for chest & NPC forms

import { pickItems }      from "../builder/listPicker.js";
import definitionsManager from "../../../../bootstrap/definitionsManager.js";

/**
 * Generic “lootPool” wiring. Works for any buildForm form that has:
 *  - fields.lootPool.get(): returns an array of currently selected definition objects
 *  - fields.lootPool.set(newArray): setter to replace the chip-list contents
 *  - form.querySelector(".chip-list-container") returns the chip-list DOM node
 *
 * To use, call this *after* the form is inserted into the DOM:
 *
 *   wireLootPool({ form: controller.form, fields: controller.fields });
 *
 * @param {{ form: HTMLFormElement, fields: Object }} args
 */
export function wireLootPool({ form, fields }) {
  // 1. Find the chip-list container under `form`.
  const chipContainer = form.querySelector(".chip-list-container");
  if (!chipContainer) {
    console.warn("wireLootPool: no .chip-list-container found. Is your form already in the DOM?");
    return;
  }

  // 2. On click → open the “pick items” modal
  chipContainer.addEventListener("click", async () => {
    // 2a. Gather all Item definitions
    const itemMap = definitionsManager.getItemDefMap(); // { id: defObj, … }
    const allItems = Object.values(itemMap);

    // 2b. Build a lightweight list for pickItems: { id, name }
    const pickList = allItems.map(it => ({
      id:   it.id,
      name: it.name || it.id
    }));

    // 2c. Get currently selected items (full objects → extract IDs)
    const currentDefs = fields.lootPool.get() || []; // e.g. [{ id, name, … }, …]
    const currentIds  = currentDefs.map(d => d.id);

    // 2d. Show the picker
    let selectedIds;
    try {
      selectedIds = await pickItems({
        title:    "Select Loot Pool Items",
        items:    pickList,
        selected: currentIds,
        labelKey: "name"
      });
    } catch {
      // User canceled; do nothing
      return;
    }

    // 2e. Build new array of full definition objects
    const newSelection = selectedIds
      .map(id => itemMap[id])
      .filter(def => !!def);

    // 2f. Update the chip-list via its setter
    fields.lootPool.set(newSelection);
  });
}
