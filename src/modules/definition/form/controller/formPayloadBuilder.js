// @file: src/modules/definition/form/controller/formPayloadBuilder.js
// @version: 1.0 — builds the form submission payload

import { getPickrHexColor } from "./pickrAdapter.js";

/**
 * Returns a function that, when called, builds
 * the payload object from current form values.
 *
 * @param {Object} fields         — fieldName → HTMLElement or controller
 * @param {Object} schema         — definition schema
 * @param {Object} pickrs         — colorKey → Pickr instance
 * @param {HTMLInputElement} filterCheckbox
 * @returns {Function} getPayload
 */
export function createGetPayload(fields, schema, pickrs, filterCheckbox) {
  return function getPayload() {
    const out = {};
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
        out[cfg.colorable] = getPickrHexColor(pickrs[cfg.colorable]);
      }
    }
    out.showInFilters = filterCheckbox?.checked ?? true;
    return out;
  };
} 