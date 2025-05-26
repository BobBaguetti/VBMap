// @file: src/modules/definition/form/controller/formPickrManager.js
// @version: 1.3 — add disposition & tier preset support

import { initFormPickrs } from "./pickrAdapter.js";
import {
  rarityColors,
  itemTypeColors,
  chestCategoryColors,
  dispositionColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";

/**
 * Initialize Pickr instances for colorable fields and
 * wire select-based presets.
 *
 * @param {HTMLFormElement} form
 * @param {Object} fields      — map of fieldName→HTMLElement
 * @param {Object} colorables  — map of colorKey→buttonElement
 * @param {Object} schema      — your form schema
 * @returns {Object} map of colorKey→Pickr instance
 */
export function setupPickrs(form, fields, colorables, schema) {
  const pickrs = initFormPickrs(form, colorables);

  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const el = fields[key];
      el.addEventListener("change", () => {
        let preset;

        switch (key) {
          case "rarity":
            preset = rarityColors[el.value];
            if (preset) {
              pickrs["rarityColor"]?.setColor(preset);
              pickrs["nameColor"]?.setColor(preset);
            }
            break;

          case "itemType":
            preset = itemTypeColors[el.value];
            if (preset) {
              pickrs["itemTypeColor"]?.setColor(preset);
            }
            break;

          case "category":
            preset = chestCategoryColors[el.value];
            if (preset) {
              pickrs["categoryColor"]?.setColor(preset);
            }
            break;

          case "disposition":
            // disposition drives the factionColor swatch
            preset = dispositionColors[el.value];
            if (preset) {
              pickrs["factionColor"]?.setColor(preset);
            }
            break;

          case "tier":
            // tier drives its own tierColor swatch
            preset = tierColors[el.value];
            if (preset) {
              pickrs["tierColor"]?.setColor(preset);
            }
            break;
        }

        // Trigger live‐preview update
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  return pickrs;
}

/**
 * Apply saved Firestore colors to Pickr instances.
 *
 * @param {Object} pickrs — map of colorKey→Pickr instance
 * @param {Object} def    — the definition object with saved values
 * @param {Object} schema — your form schema
 */
export function populateSavedColors(pickrs, def, schema) {
  setTimeout(() => {
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.colorable) {
        const colorKey = cfg.colorable;
        const saved = def[colorKey];
        if (saved && pickrs[colorKey]) {
          pickrs[colorKey].setColor(saved);
        }
      }
    });
  }, 0);
}
