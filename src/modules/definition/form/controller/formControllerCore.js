// @file: src/modules/definition/form/controller/formControllerCore.js
// @version: 1.0 — generic form controller core for header, state, payload, and events

import { createFormControllerHeader, wireFormEvents }
  from "./formControllerShell.js";
import { createFormState } from "./formStateManager.js";
import { getPickrHexColor } from "./pickrAdapter.js";

/**
 * Core wiring for a form: header, state, payload builder, reset, and submit events.
 *
 * @param {HTMLFormElement} form
 * @param {Object} fields — map of fieldName→HTMLElement or controller API for multi-fields
 * @param {Object} schema — field definitions (type, label, colorable, etc.)
 * @param {Object} pickrs — map of colorKey→Pickr instance
 * @param {string[]} pickrClearKeys — list of colorKeys to reset on clear
 * @param {Object} handlers — { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange }
 * @returns {{
 *   headerWrap: HTMLElement,
 *   reset: Function,
 *   populateBasic: Function,
 *   getPayload: Function
 * }}
 */
export function createFormCore({
  form,
  fields,
  schema,
  pickrs,
  pickrClearKeys,
  handlers
}) {
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header + filter checkbox + buttons
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
  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  let payloadId = null;

  // Build payload from form fields + pickr instances
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
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p ? getPickrHexColor(p) : null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Default values for form reset
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
      return [key, dv];
    })
  );

  // Initialize and manage form state
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

  // Reset form to defaults
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  // Basic population: set input values and filter checkbox
  function populateBasic(def) {
    payloadId = def.id ?? null;
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
    filterCheckbox.checked = def.showInFilters ?? true;
  }

  // Wire up form submission and live-change events
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);
  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit?.(getPayload());
    });
  }

  return { headerWrap, reset, populateBasic, getPayload };
}
