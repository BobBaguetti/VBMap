// @file: src/modules/definition/form/controller/formColorManager.js
// @version: 1.0 — consolidate all color‐picker & preset wiring

import { initFormPickrs } from "./pickrAdapter.js";
import { rarityColors, itemTypeColors } from "../../../../shared/utils/color/colorPresets.js";
import { setupSelectPresets, applySelectPresetsOnPopulate }
  from "./formPresetManager.js";
import { applyChestRarityLink }
  from "./chestFormEnhancements.js";
import { populateSavedColors } from "./formPickrManager.js";

/**
 * Initializes all color pickers and wiring:
 *  • creates Pickr instances
 *  • wires select→preset changes
 *  • wires chest category/size→nameColor
 *
 * @param {HTMLFormElement} form
 * @param {Object} fields        — fieldName → HTMLElement
 * @param {Object} colorables    — colorKey → swatch button
 * @param {Object} schema        — definition schema
 * @returns {Object} pickrs      — colorKey → Pickr instance
 */
export function setupFormColors(form, fields, colorables, schema) {
  // 1) create Pickr instances on all swatches
  const pickrs = initFormPickrs(form, colorables);

  // 2) wire select‐based presets (rarity, itemType)
  setupSelectPresets(schema, fields, pickrs);

  // 3) if this schema has category+size, wire chest rarity→nameColor
  if (schema.category && schema.size) {
    applyChestRarityLink(fields, pickrs);
  }

  return pickrs;
}

// Re-export for use during populate()
export { populateSavedColors, applySelectPresetsOnPopulate };
