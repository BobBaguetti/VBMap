// @file: src/modules/definition/form/controller/formDataManager.js
// @version: 1.0 — manage payload ID, payload builder, and multi-field population

import { createGetPayload } from "./formPayloadBuilder.js";
import { populateMultiFields } from "./formMultiFieldManager.js";

/**
 * Sets up data handling for a form:
 *  - tracks current payload ID
 *  - builds submission payload including ID
 *  - populates chipList & extraInfo fields
 *
 * @param {Object} fields           — fieldName → control
 * @param {Object} schema           — definition schema
 * @param {Object} pickrs           — colorKey → Pickr instance
 * @param {HTMLInputElement} filterCheckbox
 * @returns {{ setPayloadId:Function, getPayload:Function, runPopulateMulti:Function }}
 */
export function setupFormData(fields, schema, pickrs, filterCheckbox) {
  let payloadId = null;
  const rawGet = createGetPayload(fields, schema, pickrs, filterCheckbox);

  function getPayload() {
    const out = rawGet();
    out.id = payloadId;
    return out;
  }

  function setPayloadId(id) {
    payloadId = id;
  }

  function runPopulateMulti(def) {
    setPayloadId(def.id ?? null);
    populateMultiFields(fields, schema, def);
  }

  return { setPayloadId, getPayload, runPopulateMulti };
}
