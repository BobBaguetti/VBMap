// @file: src/modules/definition/form/controller/formStateManager.js
// @version: 1.3 — use picker._swatchEl to repaint button on populate

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

    // Reset text/number/select/textarea fields
    defaultFieldKeys.forEach(key => {
      if (fields[key]?.value !== undefined) fields[key].value = "";
    });

    // Apply defaultValues
    Object.entries(defaultValues).forEach(([key, val]) => {
      if (fields[key]?.value !== undefined) fields[key].value = val;
    });

    // Reset chip-lists
    chipLists.forEach(({ fieldArray, renderFn }) => {
      fieldArray.length = 0;
      renderFn();
    });

    // Clear pickr colors + swatches
    pickrClearKeys.forEach(key => {
      const p = pickrs[key];
      if (p) {
        p.setColor("#E5E6E8");
        if (p._swatchEl) p._swatchEl.style.backgroundColor = "#E5E6E8";
      }
    });

    // Header & delete button
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

    // Apply defaults for missing
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

    // Restore pickr colors + repaint swatches
    Object.entries(pickrs).forEach(([key, p]) => {
      const saved = def[key];
      if (saved) {
        p.setColor(saved);
        if (p._swatchEl) {
          p._swatchEl.style.backgroundColor = saved;
        }
      }
    });

    // Header & delete button
    subheading.textContent = editTitle;
    setDeleteVisible(true);

    onFieldChange?.(getCustom());
  }

  return { reset, populate };
}
