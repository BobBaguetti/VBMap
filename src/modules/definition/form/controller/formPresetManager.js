// @file: src/modules/definition/form/controller/formPresetManager.js
// @version: 1.1 — wire up chest `category` & npc `tier` presets

import {
  rarityColors,
  itemTypeColors,
  npcTierColors,
  chestCategoryColors
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

        if (key === "rarity") {
          preset = rarityColors[selectEl.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }
        }
        else if (key === "itemType") {
          preset = itemTypeColors[selectEl.value];
          if (preset) {
            pickrs["itemTypeColor"]?.setColor(preset);
          }
        }
        else if (key === "tier") {
          preset = npcTierColors[selectEl.value];
          if (preset) {
            pickrs["tierColor"]?.setColor(preset);
          }
        }
        else if (key === "category") {
          preset = chestCategoryColors[selectEl.value];
          if (preset) {
            pickrs["categoryColor"]?.setColor(preset);
          }
        }

        // Trigger input event for live preview
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });
}

/**
 * Apply presets on populate.
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
  if (schema.tier) {
    const preset = npcTierColors[def.tier];
    if (preset) {
      pickrs["tierColor"]?.setColor(preset);
    }
  }
  if (schema.category) {
    const preset = chestCategoryColors[def.category];
    if (preset) {
      pickrs["categoryColor"]?.setColor(preset);
    }
  }
}
