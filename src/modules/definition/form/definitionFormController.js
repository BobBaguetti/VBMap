// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.3 — ensure Pickr instances reflect saved colors on populate

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs } from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header + filter-toggle + buttons
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

  // Pin header as modal subheader
  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize all Pickr swatches
  const pickrs = initFormPickrs(form, colorables);

  // Track current entry ID
  let payloadId = null;

  // Build submission payload, including the subheader toggle
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
    // Include the “Show in Filters” toggle
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Default values for all schema fields
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) {
        dv = cfg.type === "checkbox" ? false : "";
      }
      return [key, dv];
    })
  );

  // Keys to clear when resetting Pickr
  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  // Form state manager (handles reset/populate of inputs & pickrs)
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

  // Reset to blank form + default colors + filter-toggle on
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
  }

  // Populate form & Pickr with loaded definition
  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized object from def and schema defaults
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

    // Populate normal fields
    formState.populate(sanitized);

    // **Explicitly set each Pickr to the saved color**
    for (const [, cfg] of Object.entries(schema)) {
      if (cfg.colorable) {
        const col = def[cfg.colorable] ?? null;
        const pr  = pickrs[cfg.colorable];
        if (pr && col) {
          pr.setColor(col);
        }
      }
    }

    // Restore the “Show in Filters” toggle value
    filterCheckbox.checked = def.showInFilters ?? true;

    // chipList fields need manual `.set()`
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      }
    }
  }

  // Wire up submit/cancel/filter events
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
