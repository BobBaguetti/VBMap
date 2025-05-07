// @file: src/modules/ui/forms/formLogicFactory.js
// @version: 1.0 — shared reset/populate/getCustom scaffolding

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
 *                        — optional default values for fields on reset: fieldKey→defaultValue
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
    defaults = {}
  }) {
    let _id = null;
  
    function reset() {
      form.reset();
      if (checkboxField) checkboxField.checked = false;
      Object.entries(defaults).forEach(([fieldKey, defVal]) => {
        if (fields[fieldKey]) fields[fieldKey].value = defVal;
      });
      extraInfoField.setLines([], false);
      _id = null;
    }
  
    function populate(def) {
      form.reset();
      if (checkboxField) checkboxField.checked = !!def[checkbox];
      Object.entries(fieldProps).forEach(([fieldKey, propName]) => {
        fields[fieldKey].value = def[propName] ?? "";
      });
      Object.entries(pickrProps).forEach(([pickrKey, propName]) => {
        pickrs[pickrKey]?.setColor(def[propName]);
      });
      extraInfoField.setLines(def.extraLines || [], false);
      _id = def.id || null;
    }
  
    function getCustom() {
      const out = { id: _id };
      if (checkboxField) out[checkbox] = checkboxField.checked;
      Object.entries(fieldProps).forEach(([fieldKey, propName]) => {
        out[propName] = fields[fieldKey].value.trim();
      });
      Object.entries(pickrProps).forEach(([pickrKey, propName]) => {
        out[propName] = pickrs[pickrKey]?.getColor?.()?.toHEXA?.()?.toString?.() || "";
      });
      out.extraLines = extraInfoField.getLines();
      return out;
    }
  
    return { reset, populate, getCustom };
  }
  