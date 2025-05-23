// @file: src/modules/definition/form/controller/formMultiFieldManager.js
// @version: 1.0 — handle populating chipList and extraInfo fields

/**
 * Populate chipList and extraInfo fields for a form when editing.
 *
 * @param {Object} fields — map of fieldName → control
 * @param {Object} schema — definition schema
 * @param {Object} def — definition object being populated
 */
export function populateMultiFields(fields, schema, def) {
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "chipList" && Array.isArray(def[key])) {
      // chipList: call setItems / .set
      fields[key].set(def[key]);
    } else if (cfg.type === "extraInfo") {
      // extraInfo: prefer new lines or legacy def.extraInfo
      const linesArray = Array.isArray(def[key])
        ? def[key]
        : (Array.isArray(def.extraInfo) ? def.extraInfo : []);
      fields[key].setLines(linesArray);
    }
  });
}
