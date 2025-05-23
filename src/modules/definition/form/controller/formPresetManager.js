// @file: src/modules/definition/form/controller/formPresetManager.js
// @version: 1.0 — centralize select-based color presets

import { rarityColors, itemTypeColors } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Wire selects to apply preset colors on change.
 *
 * @param {Object} schema — your form schema
 * @param {Object} fields — map of fieldName→HTMLElement
 * @param {Object} pickrs — map of colorKey→Pickr instance
 */
export function setupSelectPresets(schema, fields, pickrs) {
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const selectEl = fields[key];
      selectEl.addEventListener("change", () => {
        let preset;
        if (key === "rarity") {
          preset = rarityColors[selectEl.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }
        } else if (key === "itemType") {
          preset = itemTypeColors[selectEl.value];
          if (preset) {
            pickrs["itemTypeColor"]?.setColor(preset);
          }
        }
        // Trigger input event for live preview
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });
}

/**
 * Apply presets on populate for rarity and itemType.
 *
 * @param {Object} schema — your form schema
 * @param {Object} def — the definition object
 * @param {Object} pickrs — map of colorKey→Pickr instance
 */
export function applySelectPresetsOnPopulate(schema, def, pickrs) {
  if (schema.rarity) {
    const preset = rarityColors[def.rarity];
    if (preset) {
      pickrs["rarityColor"]?.setColor(preset);
      pickrs["nameColor"]?.setColor(preset);
    }
  }
  if (schema.itemType) {
    const preset = itemTypeColors[def.itemType];
    if (preset) {
      pickrs["itemTypeColor"]?.setColor(preset);
    }
  }
}
