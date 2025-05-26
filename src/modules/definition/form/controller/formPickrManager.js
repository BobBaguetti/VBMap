// @file: src/modules/definition/form/controller/formPickrManager.js
// @version: 1.1 — handle chest category presets

import {
  rarityColors,
  itemTypeColors,
  chestCategoryColors
} from "../../../../shared/utils/color/colorPresets.js";
import { initFormPickrs } from "./pickrAdapter.js";

/**
 * Initialize Pickr instances for colorable fields and
 * wire select-based presets.
 *
 * @param {HTMLFormElement} form
 * @param {Object} fields — map of fieldName→HTMLElement
 * @param {Object} colorables — map of colorKey→buttonElement
 * @param {Object} schema — your form schema
 * @returns {Object} map of colorKey→Pickr instance
 */
export function setupPickrs(form, fields, colorables, schema) {
  const pickrs = initFormPickrs(form, colorables);

  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const el = fields[key];
      el.addEventListener("change", () => {
        let preset;

        if (key === "rarity") {
          preset = rarityColors[el.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }

        } else if (key === "itemType") {
          preset = itemTypeColors[el.value];
          if (preset) {
            pickrs["itemTypeColor"]?.setColor(preset);
          }

        } else if (key === "category") {
          preset = chestCategoryColors[el.value];
          if (preset) {
            pickrs["categoryColor"]?.setColor(preset);
            // optionally:
            // pickrs["nameColor"]?.setColor(preset);
          }
        }

        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  return pickrs;
}
