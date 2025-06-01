// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.2 — add applyLootPoolPicker to load item definitions into lootPool

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../../map/marker/utils.js";

// Import your item‐definitions service and the picker utility
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { pickItems }           from "../builder/listPicker.js";

/**
 * Sets up auto‐application of the nameColor pickr
 * based on the current category+size for chest forms.
 *
 * @param {Object} fields — map of fieldName→HTMLElement
 * @param {Object} pickrs — map of colorableKey→Pickr instance
 */
export function applyChestRarityLink(fields, pickrs) {
  const catEl  = fields.category;
  const sizeEl = fields.size;
  if (!catEl || !sizeEl) return;

  const applyColor = () => {
    const cat  = catEl.value;
    const size = sizeEl.value;
    const key  = CHEST_RARITY[cat]?.[size];
    const preset = key ? rarityColors[key] : null;
    if (preset) {
      pickrs["nameColor"]?.setColor(preset);
      // notify form of change to update preview & payload
      catEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  catEl.addEventListener("change", applyColor);
  sizeEl.addEventListener("change", applyColor);
}

/**
 * Wires up the “lootPool” chipList so that clicking it opens
 * a modal showing ALL item definitions.  Once the user selects
 * zero or more items, it populates the chipList accordingly.
 *
 * @param {Object} fields — the same `fields` object returned by buildForm()
 *                          (so fields.lootPool is the chipList getter/setter).
 * @param {import("firebase/firestore").Firestore} db — the Firestore instance.
 *
 * USAGE:
 *   After you call `const { form, fields, colorables } = buildForm(chestSchema);`
 *   and before you display the form, do:
 *     applyLootPoolPicker(fields, db);
 */
export function applyLootPoolPicker(fields, db) {
  // `fields.lootPool` is an object with `.get()` to retrieve current IDs
  // and `.set(arrayOfIds)` to override it (see definitionFormBuilder logic).
  const chipGetterSetter = fields.lootPool;
  if (!chipGetterSetter || typeof chipGetterSetter.get !== "function") {
    console.warn("applyLootPoolPicker: fields.lootPool not found or malformed.");
    return;
  }

  // We need a clickable element to trigger the modal.  In our DOM, buildForm()
  // creates a wrapper row with id `fld-lootPool`, so we can grab that container.
  // (If your DOM structure is different, adjust this selector accordingly.)
  const containerRow = document.querySelector(`#fld-lootPool`)?.parentElement;
  if (!containerRow) {
    console.warn("applyLootPoolPicker: Could not find wrapper for lootPool field.");
    return;
  }

  // Append a small “pick items” button on the right side of the row,
  // so admins know they can click to choose loot items.
  const pickBtn = document.createElement("button");
  pickBtn.type = "button";
  pickBtn.textContent = "…";
  pickBtn.title = "Select Loot Pool…";
  pickBtn.style.marginLeft = "0.5em";
  pickBtn.classList.add("loot-pool-picker-btn");
  containerRow.appendChild(pickBtn);

  pickBtn.addEventListener("click", async () => {
    // 1) Load all item definitions (array of {id, name, …})
    let items = [];
    try {
      const raw = await loadItemDefinitions(db);
      // loadItemDefinitions should return an array like [{ id, name, … }, …]
      items = Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.error("Error loading item definitions for loot pool:", err);
      return;
    }

    // 2) Build a simplified array of items { id, name } for pickItems
    const pickerItems = items.map(i => ({ id: i.id, name: i.name }));

    // 3) Get currently‐selected IDs
    const currentSelection = chipGetterSetter.get() || [];

    // 4) Open picker modal
    let chosenIds;
    try {
      chosenIds = await pickItems({
        title:    "Select Loot Pool Items",
        items:    pickerItems,
        selected: currentSelection,
        labelKey: "name"
      });
    } catch {
      // user pressed Cancel or pressed Esc
      return;
    }

    // 5) Set the chipList to the newly chosen IDs
    chipGetterSetter.set(chosenIds);
  });
}
