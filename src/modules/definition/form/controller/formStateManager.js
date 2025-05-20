// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.1 — fix picking up saved colors into Pickr on populate

/**
 * Creates shared reset() and populate(def) handlers for a form.
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
    defaultFieldKeys.forEach(key => {
      if (fields[key]?.value !== undefined) fields[key].value = "";
    });
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (fields[key]?.value !== undefined) fields[key].value = val;
    });
    chipLists.forEach(({ fieldArray, renderFn }) => {
      fieldArray.length = 0;
      renderFn();
    });
    pickrClearKeys.forEach(key => {
      pickrs[key]?.setColor("#E5E6E8");
    });
    subheading.textContent = addTitle;
    setDeleteVisible(false);
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

    // Apply defaults if missing
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

    // **Apply saved colors into each Pickr**
    Object.entries(pickrs).forEach(([colorKey, pickr]) => {
      if (def[colorKey]) {
        pickr.setColor(def[colorKey]);
      }
    });

    subheading.textContent = editTitle;
    setDeleteVisible(true);
    onFieldChange?.(getCustom());
  }

  return { reset, populate };
}
