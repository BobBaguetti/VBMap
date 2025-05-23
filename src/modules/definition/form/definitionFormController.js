// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.10.1 — defer Pickr setup into initPickrs so saved colors stick

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

  // We'll populate this only once the form is in the DOM
  let pickrs = {};

  // Keys to clear when resetting pickrs
  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  // Initialize header, state, and payload logic
  const { reset, populateBasic, getPayload } = createFormCore({
    form,
    fields,
    schema,
    pickrs,
    pickrClearKeys,
    handlers
  });

  // This will be called by your openDefinition logic *after* the form is appended
  function initPickrs() {
    // Actually wire up Pickr on the real DOM buttons
    pickrs = setupPickrs(form, fields, colorables, schema);
    // Re-apply chest nameColor linkage now that pickrs exist
    applyChestRarityLink(fields, pickrs);
    return pickrs;
  }

  // Full populate: basic fields, multi-fields, then colors
  async function populate(def) {
    // 1) Populate simple inputs + filter checkbox
    populateBasic(def);

    // 2) Populate chipList & extraInfo
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

    // 3) Apply saved Firestore colors to the pickrs
    populateSavedColors(pickrs, def, schema);

    // 4) Auto-presets for rarity & itemType selects
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
