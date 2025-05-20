// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.1 — fix picking up saved colors into Pickr on populate

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

    // Reset simple fields
    defaultFieldKeys.forEach(key => {
      if (fields[key]?.value !== undefined) {
        fields[key].value = "";
      }
    });

    // Reset to specified defaults
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

    // Reset Pickr colors to default
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

    // Apply defaults for missing keys
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (def[key] === undefined && fields[key]?.value !== undefined) {
        fields[key].value = val;
      }
    });

    // Populate chip-lists
    chipLists.forEach(({ fieldArray, renderFn, defKey }) => {
      fieldArray.splice(0, fieldArray.length, ...(def[defKey] || []));
      renderFn();
    });

    // Populate Pickr colors from def[key] where key matches pickr map
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
