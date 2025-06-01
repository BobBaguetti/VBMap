// @file: src/modules/definition/form/controller/chestFormEnhancements.js
// @version: 1.1 — fix import paths for shared presets and chest utils

import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../../map/marker/utils.js";

/**
 * Sets up auto-application of the nameColor pickr
 * based on the current category+size for chest forms.
 *
 * @param {Object} fields — map of fieldName→HTMLElement
 * @param {Object} pickrs — map of colorableKey→Pickr instance
 */
export function applyChestRarityLink(fields, pickrs) {
  const catEl = fields.category;
  const sizeEl = fields.size;
  if (!catEl || !sizeEl) return;

  const applyColor = () => {
    const cat = catEl.value;
    const size = sizeEl.value;
    const key = CHEST_RARITY[cat]?.[size];
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
