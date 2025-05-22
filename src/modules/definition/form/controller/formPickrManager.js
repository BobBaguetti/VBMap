// @file: src/modules/definition/form/controller/formPickrManager.js
import { initFormPickrs, getPickrHexColor }
  from "../controller/pickrAdapter.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../../shared/utils/color/colorPresets.js";

/**
 * Set up Pickr instances for colorable fields and auto-apply presets.
 */
export function setupPickrs(form, colorables, schema) {
  const pickrs = initFormPickrs(form, colorables);

  // Auto-apply select-based presets (rarity, itemType)
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const sel = form.querySelector(`#fld-${key}`);
      sel?.addEventListener("change", () => {
        let preset;
        if (key === "rarity") {
          preset = rarityColors[sel.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }
        } else if (key === "itemType") {
          preset = itemTypeColors[sel.value];
          if (preset) pickrs["itemTypeColor"]?.setColor(preset);
        }
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  return pickrs;
}

/**
 * After populate, re-apply saved colors from Firestore to each Pickr.
 */
export function applySavedColors(def, pickrs, schema) {
  setTimeout(() => {
    Object.entries(schema).forEach(([_, cfg]) => {
      if (!cfg.colorable) return;
      const key = cfg.colorable;
      const val = def[key];
      if (val && pickrs[key]) pickrs[key].setColor(val);
    });
  }, 0);
}
