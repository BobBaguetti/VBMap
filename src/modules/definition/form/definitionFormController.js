// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.14 — uses formHeaderManager, formColorManager & formDataManager

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState } from "../form/controller/formStateManager.js";
import { wireFormEvents }  from "../form/controller/formControllerShell.js";
import {
  setupFormColors,
  populateSavedColors,
  applySelectPresetsOnPopulate
} from "../form/controller/formColorManager.js";
import { setupFormData }   from "../form/controller/formDataManager.js";

/**
 * Wraps a schema-built form, wiring header, state, events, colors, and data.
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

  // ─── Stub getPayload until dataMgr is created ─────────────────────────────
  let getPayload = () => ({ id: null });

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
    getPayload,    // initial stub, will be updated below
    onSubmit
  });

  // ─── Color-pickers & Presets wiring ────────────────────────────────────────
  const pickrs = setupFormColors(form, fields, colorables, schema);

  // ─── Data handling: payload ID tracking & multi-fields ────────────────────
  const dataMgr = setupFormData(fields, schema, pickrs, filterCheckbox);
  const {
    setPayloadId,
    getPayload: dataGetPayload,
    runPopulateMulti
  } = dataMgr;

  // Now override stub with real getPayload
  getPayload = dataGetPayload;

  // ─── Form State Initialization ─────────────────────────────────────────────
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
    getCustom:    getPayload,
    onFieldChange
  });

  // ─── Reset Handler ────────────────────────────────────────────────────────
  function reset() {
    setPayloadId(null);
    formState.reset();
    filterCheckbox.checked = true;
  }

  // ─── Populate Handler ─────────────────────────────────────────────────────
  async function populate(def) {
    // 1) ID + multi-field (chipList/extraInfo)
    setPayloadId(def.id ?? null);
    runPopulateMulti(def);

    // 2) Simple fields + filter checkbox
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 3) Re-apply saved colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets (rarity, itemType)
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire Events & Save Handler ───────────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Public API ─────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(
        pickrs,
        setupFormColors(form, fields, colorables, schema)
      )
  };
}
