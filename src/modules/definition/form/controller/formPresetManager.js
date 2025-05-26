// @file: src/modules/definition/form/controller/formPresetManager.js
// @version: 1.3 — listen on Disposition select and seed Faction swatch

import {
  rarityColors,
  itemTypeColors,
  chestCategoryColors,
  dispositionColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";

/**
 * Wire selects to apply preset colors on change.
 * Now also listens to "disposition" to seed the factionColor pickr.
 *
 * @param {Object} schema — your form schema
 * @param {Object} fields — map of fieldName→HTMLElement
 * @param {Object} pickrs — map of colorKey→Pickr instance
 */
export function setupSelectPresets(schema, fields, pickrs) {
  Object.entries(schema).forEach(([key, cfg]) => {
    // We want to handle all selects that either are colorable
    // or are specifically "disposition"
    if (cfg.type === "select" && (cfg.colorable || key === "disposition")) {
      const selectEl = fields[key];
      selectEl.addEventListener("change", () => {
        let preset;

        switch (key) {
          case "rarity":
            preset = rarityColors[selectEl.value];
            if (preset) {
              pickrs["rarityColor"]?.setColor(preset);
              pickrs["nameColor"]?.setColor(preset);
            }
            break;

          case "itemType":
            preset = itemTypeColors[selectEl.value];
            if (preset) {
              pickrs["itemTypeColor"]?.setColor(preset);
            }
            break;

          case "category":
            preset = chestCategoryColors[selectEl.value];
            if (preset) {
              pickrs["categoryColor"]?.setColor(preset);
            }
            break;

          case "disposition":
            // disposition drives factionColor, even though disposition itself
            // has no swatch button
            preset = dispositionColors[selectEl.value];
            if (preset) {
              pickrs["factionColor"]?.setColor(preset);
            }
            break;

          case "tier":
            preset = tierColors[selectEl.value];
            if (preset) {
              pickrs["tierColor"]?.setColor(preset);
            }
            break;
        }

        // Trigger live‐preview update
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });
}

/**
 * Apply presets on populate for rarity, itemType,
 * chest category, disposition→factionColor, and tier.
 *
 * @param {Object} schema — your form schema
 * @param {Object} def    — the definition object
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

  if (schema.category) {
    const preset = chestCategoryColors[def.category];
    if (preset) {
      pickrs["categoryColor"]?.setColor(preset);
    }
  }

  // Disposition → Faction swatch
  if (schema.disposition) {
    const preset = dispositionColors[def.disposition];
    if (preset) {
      pickrs["factionColor"]?.setColor(preset);
    }
  }

  if (schema.tier) {
    const preset = tierColors[def.tier];
    if (preset) {
      pickrs["tierColor"]?.setColor(preset);
    }
  }
}
