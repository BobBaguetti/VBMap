// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.3 

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../../map/marker/utils.js";

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { pickItems } from "../builder/listPicker.js";

/**
 * 1) Sets up auto‐application of nameColor based on category+size.
 * 2) Hooks the lootPool chipList so that, when clicked, we fetch all
 *    item definitions and pass them into `pickItems(...)`.
 *
 * @param {Object}  fields  — map of fieldName → input/helper object.
 *                          In particular, `fields.lootPool` is assumed to have:
 *                            • .get(): Array of currently selected item objects
 *                            • .set(arr): overwrite with new Array of full item objects
 *                            • .el: the DOM element to click to open the picker
 * @param {Object}  pickrs  — map of colorableKey → Pickr instance (unused for lootPool)
 * @param {Firestore} db    — your Firestore instance, so we can load item definitions
 */
export function applyChestFormEnhancements(fields, pickrs, db) {
  // ─── Part 1: Rarity → nameColor linkage ───────────────────────────────────
  const catEl  = fields.category;
  const sizeEl = fields.size;
  if (catEl && sizeEl) {
    const applyColor = () => {
      const cat  = catEl.value;
      const size = sizeEl.value;
      const key  = CHEST_RARITY[cat]?.[size];
      const preset = key ? rarityColors[key] : null;
      if (preset) {
        pickrs["nameColor"]?.setColor(preset);
        // force form to notice change (so preview & payload update)
        catEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    catEl.addEventListener("change", applyColor);
    sizeEl.addEventListener("change", applyColor);
  }

  // ─── Part 2: Loot Pool chipList wiring ────────────────────────────────────
  // We assume `fields.lootPool` has:
  //   • .get(): returns an array of already‐selected item objects (each with .id)
  //   • .set(arr): accepts an array of full item objects ({ id, name, imageSmall, … })
  //   • .el: the DOM node (e.g. a <div>) that, when clicked, should open the picker
  //
  const poolField = fields.lootPool;
  if (
    poolField &&
    poolField.el &&
    typeof poolField.get === "function" &&
    typeof poolField.set === "function"
  ) {
    poolField.el.addEventListener("click", async () => {
      try {
        // 1) Load all item definitions (array of { id, name, imageSmall, … })
        const allItems = await loadItemDefinitions(db);

        // 2) Determine which IDs are already “in” this chest’s lootPool
        //    poolField.get() should return an array of objects with an .id property
        const alreadySelected = poolField.get() || [];
        const selectedIds = alreadySelected.map(o => o.id);

        // 3) Open the modal pickItems() with full item list + pre‐checked IDs
        const chosenIds = await pickItems({
          title:    "Select Loot Pool Items",
          items:    allItems,
          selected: selectedIds,
          labelKey: "name"
        });

        // 4) When user clicks “OK”, they return an array of IDs. Map back to full items
        const chosenObjects = allItems.filter(x => chosenIds.includes(x.id));

        // 5) Write the new array back into the chipList field
        poolField.set(chosenObjects);
      } catch (err) {
        console.error("Error loading loot‐pool definitions:", err);
      }
    });
  }
}
