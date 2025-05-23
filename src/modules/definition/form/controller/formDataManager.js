// @file: src/modules/definition/form/controller/formDataManager.js
// @version: 1.0 — unify payload builder & multi-field population

import { createGetPayload } from "./formPayloadBuilder.js";
import { populateMultiFields as multiPopulator } from "./formMultiFieldManager.js";

/**
 * Sets up data operations for a definition form.
 *
 * @param {Object} fields         — fieldName → HTMLElement/controllers
 * @param {Object} schema         — your form schema
 * @param {Object} pickrs         — colorKey → Pickr instances
 * @param {HTMLInputElement} filterCheckbox
 * @returns {{ buildPayload: Function, populateFields: Function }}
 *    • buildPayload(): builds current form values (without id)  
 *    • populateFields(def): populates chipList & extraInfo fields from def
 */
export function setupFormData(fields, schema, pickrs, filterCheckbox) {
  const buildPayload = createGetPayload(fields, schema, pickrs, filterCheckbox);

  function populateFields(def) {
    multiPopulator(fields, schema, def);
  }

  return { buildPayload, populateFields };
}
