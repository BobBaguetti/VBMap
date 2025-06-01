// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.2 — automatically load item/NPC defs into lootPool picker

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../../map/marker/utils.js";

import {
  loadItemDefinitions
} from "../../../services/itemDefinitionsService.js";
import {
  loadNpcDefinitions
} from "../../../services/npcDefinitionsService.js";

import { pickItems } from "../../builder/listPicker.js";

/**
 * 1) Sets up auto-application of nameColor based on category+size.
 * 2) Hooks the lootPool chipList so that, when clicked, we fetch all
 *    item/NPC definitions and pass them into `pickItems(...)`.
 *
 * @param {Object}  fields  — map of fieldName → input or helper object.
 *                          In particular, `fields.lootPool` is assumed to
 *                          have:
 *                            • .get()  → Array of currently selected items
 *                            • .set(arr) → overwrite with new Array of items
 *                            • .el  → the DOM element that, when clicked,
 *                                      should open the picker.
 * @param {Object}  pickrs  — map of colorableKey→Pickr instance (unused for lootPool)
 * @param {Firestore} db    — your Firestore instance, so we can load defs
 */
export function applyChestFormEnhancements(fields, pickrs, db) {
  // ─── Part 1: Rarity → nameColor linkage ────────────────────────────────────
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
        // force the form to notice a change (so preview & payload update)
        catEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    catEl.addEventListener("change", applyColor);
    sizeEl.addEventListener("change", applyColor);
  }

  // ─── Part 2: Loot Pool chipList wiring ────────────────────────────────────
  // We assume `fields.lootPool` has:
  //   • .get()  → returns an array of already-selected item/NPC objects
  //   • .set(arr) → accepts an array of full objects ({ id, name, imageSmall, … })
  //   • .el → the DOM node (e.g. a button or container) that the user clicks
  //            to open a picker. If your buildForm just renders a <div> for
  //            chipList, you might need to do `fields.lootPool.el = /* that <div> */;`
  //
  // In this handler, we combine “all items” + “all NPCs” (change if you only want items).
  // You can split them or only load one category if your game uses separate services.
  //
  const poolField = fields.lootPool;
  if (poolField && poolField.el && typeof poolField.get === "function" && typeof poolField.set === "function") {
    poolField.el.addEventListener("click", async () => {
      try {
        // 1) Load all item definitions (array of { id, name, imageSmall, … })
        const allItems = await loadItemDefinitions(db);
        // 2) Load all NPC definitions too (if you want NPC drops in the same picker).
        //    If you only want items, comment this out or omit.
        const allNpcs = await loadNpcDefinitions(db);

        // Combine them into one list. Feel free to sort/merge differently.
        const allDefs = [
          // tag each so the picker’s result can be mapped back (if needed)
          ...allItems.map(i => ({ ...i, __type: "item" })),
          ...allNpcs.map(n => ({ ...n, __type: "npc" }))
        ];

        // 3) Determine which IDs are already “in” this chest’s lootPool
        //    poolField.get() should return an array of objects that were
        //    previously selected (each object must have an .id property).
        const alreadySelected = poolField.get() || [];
        const selectedIds = alreadySelected.map(o => o.id);

        // 4) Open the modal pickItems() with full array + pre-checked IDs
        const chosenIds = await pickItems({
          title:    "Select Loot Pool",
          items:    allDefs,
          selected: selectedIds,
          labelKey: "name"
        });

        // 5) When user clicks “OK”, they return an array of IDs. Map back to full objects.
        const chosenObjects = allDefs.filter(x => chosenIds.includes(x.id));

        // 6) Write the new array back into the chipList field
        poolField.set(chosenObjects);
      } catch (err) {
        console.error("Error loading loot‐pool definitions:", err);
      }
    });
  }
}
