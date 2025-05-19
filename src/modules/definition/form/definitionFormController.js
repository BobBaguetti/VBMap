// @file: src/modules/definition/form/definitionFormController.js
// @version: 1.4.1 — include subheader “Show in Filters” toggle in payload

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

  // HEADER + filter-toggle + buttons
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,    // the “Show in Filters” toggle
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

  // Pin header as the modal subheader
  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize Pickr instances
  const pickrs = initFormPickrs(form, colorables);

  // Track current entry ID
  let payloadId = null;

  // Build the payload for save/update
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

    // **Include the subheader toggle** here
    out.showInFilters = filterCheckbox.checked;

    return out;
  }

  // Defaults for schema fields
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
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
    // **Reset the filter-toggle to its default (on)**
    filterCheckbox.checked = true;
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized object from def or schema default
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

    // **Set the filter-toggle off the existing value** (default true)
    filterCheckbox.checked = def.showInFilters ?? true;

    // chipList fields need the `.set()` call
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
