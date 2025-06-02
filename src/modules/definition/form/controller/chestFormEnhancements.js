// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.3 — apply rarity link + use shared wireLootPool for lootPool

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }   from "../../../map/marker/utils.js";
import { wireLootPool }   from "./wireLootPool.js"; // new shared helper

/**
 * Sets up auto-application of the nameColor pickr
 * based on the current category+size for chest forms.
 *
 * @param {Object} fields — map of fieldName→HTMLElement or functions
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
 * Hook to wire the Chest form’s “Loot Pool” chip-list.
 * Must be called after the chest form is inserted into the DOM.
 *
 * @param {{ form: HTMLFormElement, fields: Object }} args
 */
export function wireChestLootPool({ form, fields }) {
  // Delegate to shared helper
  wireLootPool({ form, fields });
}
