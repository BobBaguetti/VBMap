// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.1 — restore colorable payload fields & fix Pickr wiring

import { createBaseController } from "../form/controller/formControllerCore.js";
import { setupPickrs, applySavedColors }
  from "../form/controller/formPickrManager.js";
import { applyChestRarityLink }
  from "../form/controller/chestEnhancements.js";
import { getPickrHexColor } from "../form/controller/pickrAdapter.js";

/**
 * Wraps a schema-built form, wiring header, state, pickr, and optional enhancements.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;

  // Core: header, payload builder, state, reset, populate, event wiring
  const core = createBaseController({ form, fields, schema, handlers });

  // Pickr: instantiate color pickers & auto-presets
  const pickrs = setupPickrs(form, colorables, schema);

  // Chest-specific: auto-link nameColor → computed rarity
  if (handlers.title === "Chest") {
    applyChestRarityLink(fields, pickrs);
  }

  // Wrap populate to also apply Firestore-saved colors
  const origPopulate = core.populate;
  core.populate = async def => {
    await origPopulate(def);
    applySavedColors(def, pickrs, schema);
  };

  // Override getPayload to include each cfg.colorable via Pickr
  const origGetPayload = core.getPayload;
  core.getPayload = () => {
    const out = origGetPayload();
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.colorable && pickrs[cfg.colorable]) {
        out[cfg.colorable] = getPickrHexColor(pickrs[cfg.colorable]);
      }
    });
    return out;
  };

  return core;
}
