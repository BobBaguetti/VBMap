// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.2 — fixed shared/ui imports

import { createFormControllerHeader, wireFormEvents } 
  from "../../../shared/ui/forms/formControllerShell.js";
import { initFormPickrs } 
  from "../../../shared/ui/forms/pickrAdapter.js";
import { createFormState } 
  from "../../../shared/ui/forms/formStateManager.js";

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

  // Shared reset/populate via formStateManager
  const formState = createFormState({
    form,
    fields,
    defaultValues: Object.fromEntries(
      Object.entries(schema).map(([k,v]) => [k, v.default])
    ),
    pickrs,
    pickrClearKeys: Object.entries(schema)
      .filter(([,v]) => v.colorable)
      .map(([,v]) => v.colorable),
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

    // Handle chipList: set selected IDs
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        fields[key].set(def[key]);
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
