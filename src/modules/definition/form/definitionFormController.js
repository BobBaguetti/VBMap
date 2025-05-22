// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.0 — refactored to use core, pickrManager & chestEnhancements

import { createBaseController } from "../form/controller/formControllerCore.js";
import { setupPickrs, applySavedColors }
  from "../form/controller/formPickrManager.js";
import { applyChestRarityLink }
  from "../form/controller/chestEnhancements.js";

/**
 * Wraps a schema-built form, wiring header, state, pickrs, and optional enhancements.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;

  // Core: header, payload, state, reset, populate, events
  const core = createBaseController({ form, fields, schema, handlers });

  // Pickr: set up color pickers & auto-presets
  const pickrs = setupPickrs(form, colorables, schema);

  // Chest-specific: auto-link nameColor → computed rarity
  if (handlers.title === "Chest") {
    applyChestRarityLink(fields, pickrs);
  }

  // Wrap populate to also apply saved Firestore colors
  const originalPopulate = core.populate;
  core.populate = async def => {
    await originalPopulate(def);
    applySavedColors(def, pickrs, schema);
  };

  return core;
}
