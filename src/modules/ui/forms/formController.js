// @file: src/modules/ui/forms/formController.js
// @version: 1.0 — generic controller for schema-driven forms

import { createFormControllerHeader, wireFormEvents }
  from "../components/formControllerShell.js";
import { initFormPickrs } from "../components/formPickrManager.js";
import { createFormState } from "../components/formStateManager.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 * @param {{ form, fields, colorables }} buildResult 
 * @param {Object} schema
 * @param {{ title:string, hasFilter?:boolean,
 *           onCancel, onSubmit, onDelete, onFieldChange }} handlers
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header with filter toggle
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

  // Initialize Pickr on all colorable buttons
  const pickrs = initFormPickrs(form, colorables);

  // Payload & ID
  let payloadId = null;
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      const valEl = fields[key];
      if (cfg.type === "checkbox") {
        out[key] = valEl.checked;
      } else if (cfg.type === "extraInfo") {
        out[key] = valEl.getLines();
      } else {
        out[key] = valEl.value;
      }
      if (cfg.colorable) {
        out[cfg.colorable] = pickrs[cfg.colorable]?.getColor() || null;
      }
    }
    return out;
  }

  // FormState for reset/populate
  const formState = createFormState({
    form,
    fields,
    defaultValues: Object.fromEntries(
      Object.entries(schema).map(([k,v]) => [k, v.default])
    ),
    pickrs,
    pickrClearKeys: Object.entries(schema)
      .filter(([,v])=>v.colorable)
      .map(([,v])=>v.colorable),
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
    payloadId = def.id || null;
    formState.populate(def);
  }

  // Wire events
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return { form, reset, populate, getPayload };
}
