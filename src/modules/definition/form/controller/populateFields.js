// @file: src/modules/definition/form/controller/populateFields.js
// @version: 1.0 — handles chipList & extraInfo population

/**
 * Populate multi-part fields (chipList and extraInfo) on a form.
 *
 * @param {Object} fields — map of fieldName→input API (or .set/.setLines)
 * @param {Object} schema — your form schema
 * @param {Object} def    — the definition object to populate from
 */
export function populateFields(fields, schema, def) {
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "chipList" && Array.isArray(def[key])) {
      // chipList field: fields[key].set(items)
      fields[key].set(def[key]);
    } else if (cfg.type === "extraInfo") {
      // extraInfo field: combine new vs. legacy extraInfo
      const fromLines  = Array.isArray(def[key]) && def[key];
      const fromLegacy = Array.isArray(def.extraInfo) && def.extraInfo;
      const lines = fromLines
        ? def[key]
        : fromLegacy
          ? def.extraInfo
          : [];
      // fields[key].setLines(lines)
      fields[key].setLines(lines);
    }
  });
}
