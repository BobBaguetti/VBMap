// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.5 — paint swatch backgrounds to reflect saved colors

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs } from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // HEADER + filter-toggle + buttons
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = createFormControllerHeader({
    title,
    hasFilter: !!hasFilter,
    onFilter: () => onFieldChange?.(getPayload()),
    onCancel,
    onDelete: () => {
      if (payloadId != null && confirm(`Delete this ${title}?`)) {
        onDelete(payloadId);
      }
    }
  });

  // Pin that header as the modal subheader
  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize Pickr instances for all colorables
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  // Build submission payload (including the showInFilters toggle)
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":
          val = el.checked;
          break;
        case "extraInfo":
          val = el.getLines();
          break;
        case "chipList":
          val = el.get();
          break;
        default:
          val = el.value;
      }
      out[key] = val;
      if (cfg.colorable) {
        out[cfg.colorable] = pickrs[cfg.colorable]?.getColor() || null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Schema defaults
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) {
        dv = cfg.type === "checkbox" ? false : "";
      }
      return [key, dv];
    })
  );

  const pickrClearKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  // Form state manager
  const formState = createFormState({
    form,
    fields,
    defaultValues,
    pickrs,
    pickrClearKeys,
    subheading,
    setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  // Reset both inputs and swatch backgrounds
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    // Clear swatch backgrounds
    Object.values(colorables).forEach(btn => {
      btn.style.backgroundColor = "";
    });
  }

  // Populate form fields, pickrs AND swatch backgrounds
  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized object
    const sanitized = {};
    for (const [key, cfg] of Object.entries(schema)) {
      if (def[key] !== undefined) {
        sanitized[key] = def[key];
      } else if (cfg.default !== undefined) {
        sanitized[key] = cfg.default;
      } else {
        sanitized[key] = cfg.type === "checkbox" ? false : "";
      }
    }

    // Populate normal inputs
    formState.populate(sanitized);

    // Apply each color to the Pickr AND the swatch button
    for (const [fieldKey, cfg] of Object.entries(schema)) {
      if (cfg.colorable) {
        const colorProp = cfg.colorable;
        const savedColor = def[colorProp] ?? null;
        const pr = pickrs[colorProp];
        const btn = colorables[colorProp];

        if (pr && savedColor) {
          pr.setColor(savedColor);
          // paint the button’s background so it shows the color
          if (btn) {
            btn.style.backgroundColor = savedColor;
          }
        }
      }
    }

    // Restore the subheader toggle
    filterCheckbox.checked = def.showInFilters ?? true;

    // Chip-list fields need manual .set()
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      }
    }
  }

  // Wire up form events
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
