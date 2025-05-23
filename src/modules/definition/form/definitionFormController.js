// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.13 — uses formDataManager for payload & multi-fields

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import { wireFormEvents }
  from "../form/controller/formControllerShell.js";
import {
  setupFormColors,
  populateSavedColors,
  applySelectPresetsOnPopulate
} from "../form/controller/formColorManager.js";
import { setupFormData } from "../form/controller/formDataManager.js";

/**
 * Wraps a schema-built form, wiring header, state, events, and helpers.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title, hasFilter,
    onCancel, onSubmit, onDelete, onFieldChange
  } = handlers;

  // ─── Header + Buttons ──────────────────────────────────────────────────────
  const {
    headerWrap, subheading,
    filterCheckbox, setDeleteVisible
  } = setupFormHeader({
    form, title, hasFilter: !!hasFilter,
    onFilter: () => onFieldChange(getPayload()),
    onCancel, onDelete, getPayload, onSubmit
  });

  // ─── Color-pickers & presets ───────────────────────────────────────────────
  const pickrs = setupFormColors(form, fields, colorables, schema);

  // ─── Data helpers (payload + multi-fields) ─────────────────────────────────
  const { getPayload, populateFields } = setupFormData(
    fields, schema, pickrs, filterCheckbox
  );

  // ─── Form State ─────────────────────────────────────────────────────────────
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
    form, fields, defaultValues,
    pickrs, pickrClearKeys,
    subheading, setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  // ─── Reset & Populate ──────────────────────────────────────────────────────
  function reset() {
    populateFields({ id: null, showInFilters: true });
    formState.reset();
    filterCheckbox.checked = true;
  }

  async function populate(def) {
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;
    populateFields(def);
    populateSavedColors(pickrs, def, schema);
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire Live Updates & Submission ────────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Public API ────────────────────────────────────────────────────────────
  return {
    form, reset, populate, getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupFormColors(form, fields, colorables, schema))
  };
}
