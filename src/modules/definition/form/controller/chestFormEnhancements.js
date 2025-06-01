// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.2 — wire up lootPool chipList to show all Item definitions

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }   from "../../../map/marker/utils.js";
import { pickItems }       from "../builder/listPicker.js";
// Corrected import path (up four levels from controller to src/bootstrap)
import definitionsManager  from "../../../../bootstrap/definitionsManager.js";

/**
 * Sets up auto-application of the nameColor pickr
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
      catEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  catEl.addEventListener("change", applyColor);
  sizeEl.addEventListener("change", applyColor);
}

/**
 * Wires up the “Loot Pool” chipList so that clicking on it
 * opens a modal to pick from all Item definitions.
 *
 * @param {Object} fields — map of fieldName→control
 *        Expecting fields.lootPool.get and fields.lootPool.setLines (for extraInfo),
 *        but buildForm in your case gives `fields.lootPool.get()` to read the
 *        current array of IDs, and `fields.lootPool.set(...)` or similar to update.
 *
 * IMPORTANT: the exact API of fields.lootPool depends on how your buildForm
 * emitted it. Here, we assume:
 *   - `fields.lootPool.get()` returns an array of selected item IDs.
 *   - `fields.lootPool.setLines(newArray)` will update the chipList to show those IDs.
 */
export function wireChestLootPool(fields) {
  // 1. Grab the container (the chip-list DOM element). Depending on your createFieldRow impl,
  //    you might have stored the actual DOM node under fields.lootPool.container, or need to query it.
  //    For this example, assume buildForm put a `.container` on fields.lootPool that is an HTMLElement.
  const container = fields.lootPool.container;
  if (!container) {
    console.warn("lootPool container not found; cannot wire chest loot pool.");
    return;
  }

  // 2. Whenever the user clicks anywhere inside that container, open pickItems
  container.addEventListener("click", async () => {
    // 2a. Fetch all Item definitions from definitionsManager
    const itemMap = definitionsManager.getItemDefMap(); // { id: defObj, … }
    const allItems = Object.values(itemMap);

    // 2b. Build a minimal array of { id, name } (or include extra fields if you like)
    const pickList = allItems.map(it => ({
      id:   it.id,
      name: it.name || it.id
    }));

    // 2c. Grab the currently selected item IDs
    const currentIds = fields.lootPool.get() || [];

    // 2d. Open the picker modal
    let selectedIds;
    try {
      selectedIds = await pickItems({
        title:    "Select Loot Pool Items",
        items:    pickList,
        selected: currentIds,
        labelKey: "name"
      });
    } catch {
      // User clicked “Cancel” or pressed Esc; do nothing
      return;
    }

    // 2e. When pickItems resolves, update the chip-list’s backing array:
    const newSelection = selectedIds
      .map(id => itemMap[id])
      .filter(def => !!def);

    // 2f. Update the chip list. Adjust this call if your chipList API is different.
    fields.lootPool.set(newSelection);
  });
}
