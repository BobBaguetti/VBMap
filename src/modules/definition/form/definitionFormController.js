// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.10.1 — re-inline deferred saved colors in populate

import { createFormCore } from "../form/controller/formControllerCore.js";
import { setupPickrs } from "../form/controller/formPickrManager.js";
import { applyChestRarityLink } from "../form/controller/chestFormEnhancements.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../map/marker/utils.js";

/**
 * High-level controller that builds the definition form,
 * wires header, state, Pickr, and custom logic.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;

  // 1) Initialize all Pickr instances + preset wiring
  const pickrs = setupPickrs(form, fields, colorables, schema);

  // 2) Chest-specific nameColor linkage
  applyChestRarityLink(fields, pickrs);

  // 3) Keys to clear on form reset
  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  // 4) Core header, state, and payload logic
  const {
    reset,
    populateBasic,
    getPayload
  } = createFormCore({
    form,
    fields,
    schema,
    pickrs,
    pickrClearKeys,
    handlers
  });

  // 5) Full populate handler includes multi-fields, deferred colors, and presets
  async function populate(def) {
    // Basic population of inputs & filter checkbox
    populateBasic(def);

    // Multi-part: chipList and extraInfo
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        fields[key].set(def[key]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(def[key])
          ? def[key]
          : Array.isArray(def.extraInfo)
            ? def.extraInfo
            : [];
        fields[key].setLines(lines);
      }
    }

    // ─── DEFERRED SAVED COLORS ────────────────────────────────────
    setTimeout(() => {
      Object.entries(schema).forEach(([key, cfg]) => {
        if (cfg.colorable) {
          const clrKey = cfg.colorable;
          const saved = def[clrKey];
          if (saved && pickrs[clrKey]) {
            pickrs[clrKey].setColor(saved);
          }
        }
      });
      // trigger form input so preview updates
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
    // ──────────────────────────────────────────────────────────────

    // Auto‐presets for rarity & itemType selects
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

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => setupPickrs(form, fields, colorables, schema)
  };
}
