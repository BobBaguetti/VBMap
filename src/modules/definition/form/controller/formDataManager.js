// @file: src/modules/definition/form/controller/formDataManager.js
// @version: 1.0 — consolidate payload builder and multi‐field populators

import { createGetPayload } from "./formPayloadBuilder.js";
import { populateMultiFields } from "./formMultiFieldManager.js";

/**
 * Sets up data-related helpers for a form:
 *  - builds payload including ID
 *  - populates multi-part fields (chipList, extraInfo)
 *
 * @param {Object} fields           — map of fieldName→HTMLElement/controller
 * @param {Object} schema           — definition schema
 * @param {Object} pickrs           — map of colorKey→Pickr instance
 * @param {HTMLInputElement} filterCheckbox
 * @returns {{
 *   getPayload: Function,
 *   populateFields: Function
 * }}
 */
export function setupFormData(fields, schema, pickrs, filterCheckbox) {
  let payloadId = null;
  const rawGetPayload = createGetPayload(fields, schema, pickrs, filterCheckbox);

  function getPayload() {
    const out = rawGetPayload();
    out.id = payloadId;
    return out;
  }

  function populateFields(def) {
    payloadId = def.id ?? null;
    populateMultiFields(fields, schema, def);
  }

  return { getPayload, populateFields };
}
