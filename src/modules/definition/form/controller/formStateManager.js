// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.1 — fix pickr color population to use correct keys

/**
 * Creates shared reset() and populate(def) handlers for a form.
 *
 * @param {object} params
 * @param {HTMLFormElement} params.form
 * @param {object} params.fields
 * @param {string[]} [params.defaultFieldKeys]
 * @param {object<string, any>} [params.defaultValues]
 * @param {object<string, Pickr>} [params.pickrs]
 * @param {string[]} [params.pickrClearKeys]
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

    // apply pickr colors (use direct key matching schema.colorable)
    Object.entries(pickrs).forEach(([key, p]) => {
      if (def[key]) {
        p.setColor(def[key]);
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
