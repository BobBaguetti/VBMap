// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.1 — fix populate to restore saved pickr colors

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
    // Previously we did const colorKey = `${key}Color`, which was wrong.
    Object.entries(pickrs).forEach(([key, p]) => {
      // Use the exact key (e.g. "nameColor", "rarityColor")
      const saved = def[key];
      if (saved) {
        p.setColor(saved);
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
