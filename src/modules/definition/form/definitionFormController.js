// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.14 — uses formHeaderManager, formColorManager, formDataManager & formStateConfigurator

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { wireFormEvents }  from "../form/controller/formControllerShell.js";
import {
  setupFormColors,
  populateSavedColors,
  applySelectPresetsOnPopulate
} from "../form/controller/formColorManager.js";
import { setupFormData }   from "../form/controller/formDataManager.js";
import { setupFormState }  from "../form/controller/formStateConfigurator.js";

/**
 * Wraps a schema-built form, wiring header, state, events, colors, and data.
 *
 * @param {{ form: HTMLFormElement, fields: Object, colorables: Object }} buildResult
 * @param {Object} schema     — definition schema
 * @param {Object} handlers   — { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange }
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

  // ─── Header + Filter + Save/Delete ─────────────────────────────────────────
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

  // ─── Color-pickers & Preset Wiring ─────────────────────────────────────────
  const pickrs = setupFormColors(form, fields, colorables, schema);

  // ─── Data: payload builder & multi-field populator ─────────────────────────
  const { buildPayload, populateFields } =
    setupFormData(fields, schema, pickrs, filterCheckbox);

  // ─── Payload wrapper to include ID ──────────────────────────────────────────
  let payloadId = null;
  function getPayload() {
    const out = buildPayload();
    out.id = payloadId;
    return out;
  }

  // ─── Form State Initialization ──────────────────────────────────────────────
  const formState = setupFormState({
    form,
    fields,
    schema,
    pickrs,
    subheading,
    setDeleteVisible,
    getCustom:   getPayload,
    onFieldChange
  });

  // ─── Reset & Populate ───────────────────────────────────────────────────────
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    });
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Basic populate into form controls
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields: chipList & extraInfo
    populateFields(def);

    // 3) Re-apply any saved colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire form events & return public API ──────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupFormColors(form, fields, colorables, schema))
  };
}
