// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.13 — uses formHeaderManager, formColorManager & formDataManager

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState } from "../form/controller/formStateManager.js";
import { wireFormEvents }  from "../form/controller/formControllerShell.js";
import { setupFormColors,
         populateSavedColors,
         applySelectPresetsOnPopulate }
  from "../form/controller/formColorManager.js";
import { setupFormData }    from "../form/controller/formDataManager.js";

/**
 * Wraps a schema-built form, wiring header, state, events, and colors.
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

  // ─── Color-pickers & Preset Wiring ─────────────────────────────────────────
  const pickrs = setupFormColors(form, fields, colorables, schema);

  // ─── Data: payload builder & multi-field populator ────────────────────────
  const { buildPayload, populateFields } =
    setupFormData(fields, schema, pickrs, filterCheckbox);

  // wrap payload to include id
  let payloadId = null;
  function getPayload() {
    const out = buildPayload();
    out.id = payloadId;
    return out;
  }

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

    // 3) Re-apply saved Firestore colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire form input & submit events ───────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ─── Public API ────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupFormColors(form, fields, colorables, schema))
  };
}
