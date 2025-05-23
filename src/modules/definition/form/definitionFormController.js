// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.11 — use formHeaderManager for header & buttons

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import { wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { rarityColors, itemTypeColors }
  from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }
  from "../../map/marker/utils.js";
import { applyChestRarityLink }
  from "../form/controller/chestFormEnhancements.js";
import {
  setupPickrs,
  populateSavedColors
} from "../form/controller/formPickrManager.js";
import { populateMultiFields }
  from "../form/controller/formMultiFieldManager.js";
import {
  setupSelectPresets,
  applySelectPresetsOnPopulate
} from "../form/controller/formPresetManager.js";
import { createGetPayload }
  from "../form/controller/formPayloadBuilder.js";

/**
 * Wraps a schema-built form, wiring header, state, events, and Pickr.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title,
    hasFilter,
    onCancel,
    onSubmit,
    onDelete,
    onFieldChange
  } = handlers;

  // ─── Header + Filter & Buttons ─────────────────────────────────────────────
  const {
    headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = setupFormHeader({
    form,
    title,
    hasFilter: !!hasFilter,
    onFilter: () => onFieldChange(getPayload()),
    onCancel,
    onDelete,
    getPayload,
    onSubmit
  });

  // ─── Init Pickr instances & wiring ──────────────────────────────────────────
  const pickrs = setupPickrs(form, fields, colorables, schema);

  // ─── Wire select-based presets ──────────────────────────────────────────────
  setupSelectPresets(schema, fields, pickrs);

  // ─── Chest-specific: auto-link nameColor to computed rarity ────────────────
  applyChestRarityLink(fields, pickrs);

  // ─── Payload builder (wrapped to include id) ────────────────────────────────
  let payloadId = null;
  const rawGetPayload = createGetPayload(fields, schema, pickrs, filterCheckbox);
  function getPayload() {
    const out = rawGetPayload();
    out.id = payloadId;
    return out;
  }

  // ─── Defaults & Form State ─────────────────────────────────────────────────
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
      return [key, dv];
    })
  );
  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  const formState = createFormState({
    form,
    fields,
    defaultValues,
    pickrs,
    pickrClearKeys,
    subheading,
    setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  // ─── Reset & Populate ───────────────────────────────────────────────────────
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Basic populate into inputs & state
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields: chipList, extraInfo
    populateMultiFields(fields, schema, def);

    // 3) Apply saved Firestore colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire Events & Save Handler ─────────────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Public API ─────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupPickrs(form, fields, colorables, schema))
  };
}
