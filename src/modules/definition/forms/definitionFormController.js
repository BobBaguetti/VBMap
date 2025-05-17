// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.2 — sanitize undefined values to defaults/empty strings in defaultValues & populate

import { createFormControllerHeader, wireFormEvents }
  from "../../../shared/ui/forms/formControllerShell.js";
import { initFormPickrs } from "../../../shared/ui/forms/pickrAdapter.js";
import { createFormState } from "../../../shared/ui/forms/formStateManager.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header + filter & buttons
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = createFormControllerHeader({
    title,
    hasFilter: !!hasFilter,
    onFilter: () => onFieldChange?.(getPayload()),
    onCancel,
    onDelete: () => {
      if (payloadId != null && confirm(`Delete this ${title}?`)) {
        onDelete(payloadId);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize Pickr swatches
  const pickrs = initFormPickrs(form, colorables);

  // Track current definition ID
  let payloadId = null;

  // Build payload for submission
  function getPayload() {
    const out = { id: payloadId };
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
        out[cfg.colorable] = pickrs[cfg.colorable]?.getColor() || null;
      }
    }
    return out;
  }

  // Prepare formState with sane defaults (no undefined)
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      // If schema.default provided, use it; otherwise empty string or false for checkboxes
      let dv = cfg.default;
      if (dv === undefined) {
        dv = cfg.type === "checkbox" ? false : "";
      }
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

  function reset() {
    payloadId = null;
    formState.reset();
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Build a sanitized object using either def[key] or the schema default (never undefined)
    const sanitized = {};
    for (const [key, cfg] of Object.entries(schema)) {
      if (def[key] !== undefined) {
        sanitized[key] = def[key];
      } else if (cfg.default !== undefined) {
        sanitized[key] = cfg.default;
      } else {
        sanitized[key] = cfg.type === "checkbox" ? false : "";
      }
    }

    formState.populate(sanitized);

    // Handle chipList specially
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      }
    }
  }

  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
