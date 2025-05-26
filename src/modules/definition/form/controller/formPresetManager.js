// @file: src/modules/definition/form/controller/formPresetManager.js
// @version: 1.2 — added chest category and NPC tier presets

import {
  rarityColors,
  itemTypeColors,
  chestCategoryColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";

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

        // Item rarity
        if (key === "rarity") {
          preset = rarityColors[selectEl.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }

        // Item type
        } else if (key === "itemType") {
          preset = itemTypeColors[selectEl.value];
          if (preset) {
            pickrs["itemTypeColor"]?.setColor(preset);
          }

        // Chest category
        } else if (key === "category") {
          preset = chestCategoryColors[selectEl.value];
          if (preset) {
            pickrs["categoryColor"]?.setColor(preset);
          }

        // NPC tier
        } else if (key === "tier") {
          preset = tierColors[selectEl.value];
          if (preset) {
            pickrs["tierColor"]?.setColor(preset);
          }
        }

        // Trigger input event for live preview
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });
}

/**
 * Apply presets on populate for rarity, itemType, chest category, and tier.
 *
 * @param {Object} schema — your form schema
 * @param {Object} def — the definition object
 * @param {Object} pickrs — map of colorKey→Pickr instance
 */
export function applySelectPresetsOnPopulate(schema, def, pickrs) {
  // Rarity
  if (schema.rarity) {
    const preset = rarityColors[def.rarity];
    if (preset) {
      pickrs["rarityColor"]?.setColor(preset);
      pickrs["nameColor"]?.setColor(preset);
    }
  }

  // Item type
  if (schema.itemType) {
    const preset = itemTypeColors[def.itemType];
    if (preset) {
      pickrs["itemTypeColor"]?.setColor(preset);
    }
  }

  // Chest category
  if (schema.category) {
    const preset = chestCategoryColors[def.category];
    if (preset) {
      pickrs["categoryColor"]?.setColor(preset);
    }
  }

  // NPC tier
  if (schema.tier) {
    const preset = tierColors[def.tier];
    if (preset) {
      pickrs["tierColor"]?.setColor(preset);
    }
  }
}
