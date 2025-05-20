// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.2 — restore swatch backgrounds when populating saved colors

/**
 * Creates shared reset() and populate(def) handlers for a form.
 *
 * @param {object} params
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

    // simple fields
    defaultFieldKeys.forEach(key => {
      if (fields[key]?.value !== undefined) fields[key].value = "";
    });

    // defaults
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (fields[key]?.value !== undefined) fields[key].value = val;
    });

    // chip-lists
    chipLists.forEach(({ fieldArray, renderFn }) => {
      fieldArray.length = 0;
      renderFn();
    });

    // clear pickrs & swatches
    pickrClearKeys.forEach(key => {
      const p = pickrs[key];
      if (p) {
        p.setColor("#E5E6E8");
        // update button
        const btn = document.getElementById(`fld-${key}-color`);
        if (btn) btn.style.backgroundColor = "#E5E6E8";
      }
    });

    // header & delete
    subheading.textContent = addTitle;
    setDeleteVisible(false);

    onFieldChange?.(getCustom());
  }

  function populate(def) {
    form.reset();

    // fill inputs
    Object.keys(fields).forEach(key => {
      if (def[key] !== undefined && fields[key]?.value !== undefined) {
        fields[key].value = def[key];
      }
    });

    // defaults for missing
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (def[key] === undefined && fields[key]?.value !== undefined) {
        fields[key].value = val;
      }
    });

    // chip-lists
    chipLists.forEach(({ fieldArray, renderFn, defKey }) => {
      fieldArray.splice(0, fieldArray.length, ...(def[defKey] || []));
      renderFn();
    });

    // pickr colors + swatches
    Object.entries(pickrs).forEach(([key, p]) => {
      const saved = def[key];
      if (saved) {
        p.setColor(saved);
        // Immediately sync the button swatch
        const btn = document.getElementById(`fld-${key}-color`);
        if (btn) {
          btn.style.backgroundColor = saved;
        }
      }
    });

    // header & delete
    subheading.textContent = editTitle;
    setDeleteVisible(true);

    onFieldChange?.(getCustom());
  }

  return { reset, populate };
}
