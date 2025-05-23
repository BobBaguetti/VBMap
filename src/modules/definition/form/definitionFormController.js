// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.13 — uses formHeaderManager, formColorManager & formDataManager

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState } from "../form/controller/formStateManager.js";
import { wireFormEvents }  from "../form/controller/formControllerShell.js";
import { setupFormColors, populateSavedColors, applySelectPresetsOnPopulate }
  from "../form/controller/formColorManager.js";
import { setupFormData }   from "../form/controller/formDataManager.js";

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

  // ─── Data handling: payload ID, payload builder & multi-fields ───────────
  const dataMgr = setupFormData(fields, schema, pickrs, filterCheckbox);
  const { setPayloadId, getPayload, runPopulateMulti } = dataMgr;

  // ─── Form State Initialization ─────────────────────────────────────────────
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k,c]) => [
      k,
      c.default !== undefined
        ? c.default
        : (c.type === "checkbox" ? false : "")
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

  // ─── Reset & Populate ───────────────────────────────────────────────────────
  function reset() {
    setPayloadId(null);
    formState.reset();
    filterCheckbox.checked = true;
  }

  async function populate(def) {
    setPayloadId(def.id ?? null);

    // 1) Populate chipList & extraInfo
    runPopulateMulti(def);

    // 2) Populate basic fields & filter checkbox
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 3) Re-apply any saved colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire form events & save handler ───────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Public API ─────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupFormColors(form, fields, colorables, schema))
  };
}
