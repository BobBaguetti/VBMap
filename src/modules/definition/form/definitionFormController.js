// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.12 — uses formHeaderManager & formColorManager

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import { wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { createGetPayload }
  from "../form/controller/formPayloadBuilder.js";
import { populateMultiFields }
  from "../form/controller/formMultiFieldManager.js";
import {
  setupFormColors,
  populateSavedColors,
  applySelectPresetsOnPopulate
} from "../form/controller/formColorManager.js";

/**
 * Wraps a schema-built form, wiring header, state, events, and colors.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title, hasFilter,
    onCancel, onSubmit, onDelete, onFieldChange
  } = handlers;

  // ─── Header + Filter + Save/Delete ────────────────────────────────────────
  const {
    headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = setupFormHeader({
    form,
    title,
    hasFilter: !!hasFilter,
    onFilter:   () => onFieldChange(getPayload()),
    onCancel,
    onDelete,
    getPayload,
    onSubmit
  });

  // ─── Color-pickers & Presets wiring ────────────────────────────────────────
  const pickrs = setupFormColors(form, fields, colorables, schema);

  // ─── Build payload (includes id) ───────────────────────────────────────────
  let payloadId = null;
  const rawGetPayload = createGetPayload(fields, schema, pickrs, filterCheckbox);
  function getPayload() {
    const out = rawGetPayload();
    out.id = payloadId;
    return out;
  }

  // ─── Form State Initialization ─────────────────────────────────────────────
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k,c]) => [
      k,
      c.default !== undefined
        ? c.default
        : (c.type==="checkbox"?false:"")
    ])
  );
  const pickrClearKeys = Object.entries(schema)
    .filter(([,c]) => c.colorable)
    .map(([,c]) => c.colorable);

  const formState = createFormState({
    form,
    fields,
    defaultValues,
    pickrs,
    pickrClearKeys,
    subheading,
    setDeleteVisible,
    getCustom:    getPayload,
    onFieldChange
  });

  // ─── Reset & Populate ─────────────────────────────────────────────────────
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.values(schema).forEach(cfg => {
      if (cfg.type === "extraInfo") {
        fields[cfg.idKey]?.setLines?.([]);
      }
    });
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Basic populate into form controls
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields (chipList, extraInfo)
    populateMultiFields(fields, schema, def);

    // 3) Re-apply any saved colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select‐based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire form input, submit, and live-preview ────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Expose public API ────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupFormColors(form, fields, colorables, schema))
  };
}
