// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.1 — fix populate color loading into Pickr

/**
 * Creates shared reset() and populate(def) handlers for a form.
 *
 * @param {object} params
 * @param {HTMLFormElement} params.form
 * @param {object} params.fields           — map of field keys to their input elements
 * @param {object<string, any>} [params.defaultValues] 
 *        map of field keys to default values on reset()
 * @param {object<string, Pickr>} [params.pickrs] 
 *        map of Pickr instances by key (e.g. "nameColor", "rarityColor")
 * @param {string[]} [params.pickrClearKeys] 
 *        pickr keys to reset to default color on reset()
 * @param {Array<{ fieldArray: any[], renderFn: Function, defKey: string }>} [params.chipLists]
 * @param {HTMLElement} params.subheading
 * @param {Function} params.setDeleteVisible
 * @param {string} params.addTitle
 * @param {string} params.editTitle
 * @param {Function} params.getCustom
 * @param {Function} [params.onFieldChange]
 *
 * @returns {{ reset: Function, populate: Function }}
 */
export function createFormState({
  form,
  fields,
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

    // Reset simple fields to defaults
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (fields[key]?.value !== undefined) {
        fields[key].value = val;
      }
    });

    // Clear chip-list arrays
    chipLists.forEach(({ fieldArray, renderFn }) => {
      fieldArray.length = 0;
      renderFn();
    });

    // Reset Pickr colors
    pickrClearKeys.forEach(key => {
      pickrs[key]?.setColor("#E5E6E8");
    });

    // Header & delete button
    subheading.textContent = addTitle;
    setDeleteVisible(false);

    // Live-preview update
    onFieldChange?.(getCustom());
  }

  function populate(def) {
    form.reset();

    // Populate simple fields
    Object.keys(fields).forEach(key => {
      if (def[key] !== undefined && fields[key]?.value !== undefined) {
        fields[key].value = def[key];
      }
    });

    // Populate chip-lists
    chipLists.forEach(({ fieldArray, renderFn, defKey }) => {
      fieldArray.splice(0, fieldArray.length, ...(def[defKey] || []));
      renderFn();
    });

    // Populate Pickr colors from def[key]
    Object.entries(pickrs).forEach(([key, p]) => {
      if (def[key]) {
        p.setColor(def[key]);
      }
    });

    // Header & delete button
    subheading.textContent = editTitle;
    setDeleteVisible(true);

    // Live-preview update
    onFieldChange?.(getCustom());
  }

  return { reset, populate };
}
