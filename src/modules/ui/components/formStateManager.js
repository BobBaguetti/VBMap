// @file: src/modules/ui/components/formStateManager.js
// @version: 1.0 — shared reset & populate scaffolding for form controllers

/**
 * Creates shared reset() and populate(def) handlers for a form.
 *
 * @param {object} params
 * @param {HTMLFormElement} params.form
 * @param {object} params.fields           — map of field keys to their input elements
 * @param {string[]} [params.defaultFieldKeys] 
 *        keys in `fields` to reset to empty string on reset()
 * @param {object<string, any>} [params.defaultValues] 
 *        map of field keys to default values on reset()
 * @param {object<string, Pickr>} [params.pickrs] 
 *        map of pickr instances by key
 * @param {string[]} [params.pickrClearKeys] 
 *        pickr keys to reset to "#E5E6E8" on reset()
 * @param {Array<{ fieldArray: any[], renderFn: Function, defKey: string }>} [params.chipLists]
 *        for each list of chips, the array property, its render function, and the def object key
 * @param {HTMLElement} params.subheading
 *        the <h3> element whose text is toggled
 * @param {Function} params.setDeleteVisible
 *        callback to show/hide the delete button
 * @param {string} params.addTitle
 *        subheading text for add mode
 * @param {string} params.editTitle
 *        subheading text for edit mode
 * @param {Function} params.getCustom
 *        function returning the current form payload
 * @param {Function} [params.onFieldChange]
 *        called with getCustom() after reset() or populate()
 *
 * @returns {{ reset: Function, populate: Function }}
 */
export function createFormState({
    form,
    fields,
    defaultFieldKeys = [],
    defaultValues    = {},
    pickrs           = {},
    pickrClearKeys   = [],
    chipLists        = [],
    subheading,
    setDeleteVisible,
    addTitle,
    editTitle,
    getCustom,
    onFieldChange
  }) {
    function reset() {
      form.reset();
  
      // reset simple fields
      defaultFieldKeys.forEach(key => {
        if (fields[key]?.value !== undefined) {
          fields[key].value = "";
        }
      });
  
      // reset to specified defaults
      Object.entries(defaultValues).forEach(([key, val]) => {
        if (fields[key]?.value !== undefined) {
          fields[key].value = val;
        }
      });
  
      // reset any chip-list arrays
      chipLists.forEach(({ fieldArray, renderFn }) => {
        fieldArray.length = 0;
        renderFn();
      });
  
      // clear pickr colors
      pickrClearKeys.forEach(key => {
        pickrs[key]?.setColor("#E5E6E8");
      });
  
      // header & delete button
      subheading.textContent = addTitle;
      setDeleteVisible(false);
  
      // notify live-preview
      onFieldChange?.(getCustom());
    }
  
    function populate(def) {
      form.reset();
  
      // populate fields from definition
      Object.keys(fields).forEach(key => {
        if (def[key] !== undefined && fields[key]?.value !== undefined) {
          fields[key].value = def[key];
        }
      });
  
      // apply defaults for missing keys
      Object.entries(defaultValues).forEach(([key, val]) => {
        if (def[key] === undefined && fields[key]?.value !== undefined) {
          fields[key].value = val;
        }
      });
  
      // populate chip-lists
      chipLists.forEach(({ fieldArray, renderFn, defKey }) => {
        fieldArray.splice(0, fieldArray.length, ...(def[defKey] || []));
        renderFn();
      });
  
      // apply pickr colors
      Object.entries(pickrs).forEach(([key, p]) => {
        const colorKey = `${key}Color`;
        if (def[colorKey]) {
          p.setColor(def[colorKey]);
        }
      });
  
      // header & delete button
      subheading.textContent = editTitle;
      setDeleteVisible(true);
  
      // notify live-preview
      onFieldChange?.(getCustom());
    }
  
    return { reset, populate };
  }
  