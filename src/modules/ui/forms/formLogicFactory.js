// @file: src/modules/ui/forms/formLogicFactory.js
// @version: 1.1 — reset now also resets Pickr swatches to default color

/**
 * Factory for the standard trio of form methods: reset, populate, getCustom.
 *
 * @param {object} opts
 * @param {HTMLFormElement} opts.form
 * @param {object} opts.fields       — your fields object (e.g. from builder)
 * @param {object} opts.pickrs       — map of Pickr instances (or empty)
 * @param {HTMLInputElement} [opts.checkboxField]
 * @param {object} opts.properties
 * @param {string} opts.properties.checkbox    — output prop for checkbox
 * @param {Record<string,string>} opts.properties.fieldProps
 *                        — map fieldKey→outputProp (fields[fieldKey].value)
 * @param {Record<string,string>} opts.properties.pickrProps
 *                        — map pickrKey→outputColorProp
 * @param {object} [opts.defaults={}]
 *                        — default values for fields on reset: fieldKey→defaultValue
 * @param {string} [opts.defaultPickrColor="#E5E6E8"]
 *                        — default color for Pickr swatches on reset
 * @param {object} opts.extraInfoField
 *                        — your extra-info block API (has setLines/getLines)
 */
export function createFormLogic({
  form,
  fields,
  pickrs,
  checkboxField,
  extraInfoField,
  properties: { checkbox, fieldProps, pickrProps },
  defaults = {},
  defaultPickrColor = "#E5E6E8"
}) {
  let _id = null;

  function reset() {
    form.reset();
    if (checkboxField) checkboxField.checked = false;

    // reset simple fields
    Object.entries(defaults).forEach(([fieldKey, defVal]) => {
      if (fields[fieldKey]) fields[fieldKey].value = defVal;
    });

    // reset extra-info lines
    extraInfoField.setLines([], false);

    // reset all Pickr swatches to default color
    Object.values(pickrs).forEach(p => {
      try { p.setColor(defaultPickrColor); }
      catch {}
    });

    _id = null;
  }

  function populate(def) {
    form.reset();

    // checkbox
    if (checkboxField) checkboxField.checked = !!def[checkbox];

    // simple fields
    Object.entries(fieldProps).forEach(([fieldKey, propName]) => {
      if (fields[fieldKey]) {
        fields[fieldKey].value = def[propName] ?? "";
      }
    });

    // Pickr swatches
    Object.entries(pickrProps).forEach(([pickrKey, propName]) => {
      pickrs[pickrKey]?.setColor(def[propName] || defaultPickrColor);
    });

    // extra-info
    extraInfoField.setLines(def.extraLines || [], false);

    _id = def.id || null;
  }

  function getCustom() {
    const out = { id: _id };

    if (checkboxField) {
      out[checkbox] = checkboxField.checked;
    }

    // gather simple fields
    Object.entries(fieldProps).forEach(([fieldKey, propName]) => {
      out[propName] = fields[fieldKey].value.trim();
    });

    // gather pickr colors
    Object.entries(pickrProps).forEach(([pickrKey, propName]) => {
      const color = pickrs[pickrKey]?.getColor?.()?.toHEXA?.()?.toString?.();
      out[propName] = color || defaultPickrColor;
    });

    // extra info
    out.extraLines = extraInfoField.getLines();

    return out;
  }

  return { reset, populate, getCustom };
}
