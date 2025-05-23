// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.12 — uses formHeaderManager & formColorManager

import { setupFormHeader } from "../form/controller/formHeaderManager.js";
import { createFormState } from "../form/controller/formStateManager.js";
import { wireFormEvents }  from "../form/controller/formControllerShell.js";
import { setupFormColors, populateSavedColors, applySelectPresetsOnPopulate }
  from "../form/controller/formColorManager.js";

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

  // ─── Payload builder (wrapped to include id) ────────────────────────────────
  let payloadId = null;
  function getPayload() {
    const out = {};
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":
          val = el.checked;
          break;
        case "extraInfo":
          val = el.getLines();
          break;
        case "chipList":
          val = el.get();
          break;
        default:
          val = el.value;
      }
      out[key] = val;
      if (cfg.colorable) {
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p?.getColor()?.toHEXA?.()?.toString?.() || null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    out.id = payloadId;
    return out;
  }

  // ─── Defaults & Form State ─────────────────────────────────────────────────
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k,c]) => {
      let dv = c.default;
      if (dv === undefined) dv = c.type === "checkbox" ? false : "";
      return [k, dv];
    })
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
    getCustom: getPayload,
    onFieldChange
  });

  // ─── Reset & Populate ───────────────────────────────────────────────────────
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Basic populate into form controls
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields: chipList, extraInfo
    Object.entries(schema).forEach(([key,cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        fields[key].set(def[key]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(def[key])
          ? def[key]
          : (Array.isArray(def.extraInfo) ? def.extraInfo : []);
        fields[key].setLines(lines);
      }
    });

    // 3) Re-apply saved Firestore colors
    populateSavedColors(pickrs, def, schema);

    // 4) Apply select-based presets from loaded def
    applySelectPresetsOnPopulate(schema, def, pickrs);
  }

  // ─── Wire form events & submit handler ─────────────────────────────────────
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
