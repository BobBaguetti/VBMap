// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.10.2 — re-dispatch form input after loading saved Pickr colors

import { createFormCore } from "../form/controller/formControllerCore.js";
import { setupPickrs, populateSavedColors }
  from "../form/controller/formPickrManager.js";
import { applyChestRarityLink }
  from "../form/controller/chestFormEnhancements.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }
  from "../../map/marker/utils.js";

export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;

  // 1) Pickr setup deferred into initPickrs()
  let pickrs = {};
  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  // 2) Core wiring
  const { reset, populateBasic, getPayload } = createFormCore({
    form, fields, schema, pickrs: pickrs, pickrClearKeys, handlers
  });

  // 3) initPickrs called by modal code
  function initPickrs() {
    pickrs = setupPickrs(form, fields, colorables, schema);
    applyChestRarityLink(fields, pickrs);
    return pickrs;
  }

  // 4) Full populate: basics, multi-fields, colors, then preview update
  async function populate(def) {
    // A) Basic input fields + filter checkbox
    populateBasic(def);

    // B) Multi-part fields
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

    // C) Apply saved Pickr colors (deferred)
    populateSavedColors(pickrs, def, schema);

    // ───────────── NEW ──────────────────────────
    // Force a form "input" event so preview updates with those colors
    setTimeout(() => {
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
    // ─────────────────────────────────────────────

    // D) Select-based presets for rarity & itemType
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
    initPickrs
  };
}
