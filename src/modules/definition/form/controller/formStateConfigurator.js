// @file: src/modules/definition/form/controller/formStateConfigurator.js
// @version: 1.0 — initialize createFormState with schema defaults and pickr keys

import { createFormState } from "./formStateManager.js";

/**
 * Sets up form state with default values and pickr clear keys.
 *
 * @param {HTMLFormElement} form
 * @param {Object} fields           — fieldName → HTMLElement/controllers
 * @param {Object} schema           — definition schema
 * @param {Object} pickrs           — colorKey → Pickr instances
 * @param {HTMLElement} subheading
 * @param {Function} setDeleteVisible
 * @param {Function} getCustom      — custom payload builder callback
 * @param {Function} onFieldChange
 * @returns {Object} formState      — with .reset() and populate capabilities
 */
export function setupFormState({
  form,
  fields,
  schema,
  pickrs,
  subheading,
  setDeleteVisible,
  getCustom,
  onFieldChange
}) {
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

  return createFormState({
    form,
    fields,
    defaultValues,
    pickrs,
    pickrClearKeys,
    subheading,
    setDeleteVisible,
    getCustom,
    onFieldChange
  });
}
