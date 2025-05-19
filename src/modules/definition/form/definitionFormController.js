// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.7 — manually paint Pickr preview button to reflect saved colors

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

  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize all Pickr instances
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  // Build the save/update payload
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":    val = el.checked; break;
        case "extraInfo":   val = el.getLines(); break;
        case "chipList":    val = el.get();      break;
        default:            val = el.value;
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
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
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

  // Reset inputs + swatches
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    // Clear inline backgrounds
    Object.values(colorables).forEach(btn => {
      btn.style.backgroundColor = "";
    });
    // Also clear Pickr preview buttons
    Object.values(pickrs).forEach(p => {
      const root = p.getRoot?.();
      const previewBtn = root?.querySelector(".pcr-button");
      if (previewBtn) previewBtn.style.backgroundColor = "";
    });
  }

  // Populate inputs, Pickr + swatches
  async function populate(def) {
    payloadId = def.id ?? null;

    // Sanitize using schema defaults
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

    // Fill fields
    formState.populate(sanitized);

    // For each colorable field, apply to Pickr + swatch btn + Pickr preview
    for (const [fieldKey, cfg] of Object.entries(schema)) {
      if (!cfg.colorable) continue;
      const colorProp = cfg.colorable;
      const savedColor = def[colorProp] ?? null;
      const pr   = pickrs[colorProp];
      const btn  = colorables[colorProp];

      if (pr && savedColor) {
        // 1) Update Pickr internal color
        pr.setColor(savedColor);
        // 2) Manually paint the Pickr preview button
        const root = pr.getRoot?.();
        const previewBtn = root?.querySelector(".pcr-button");
        if (previewBtn) {
          previewBtn.style.backgroundColor = savedColor;
        }
        // 3) Paint your swatch wrapper as well
        if (btn) {
          btn.style.backgroundColor = savedColor;
        }
      }
    }

    // Restore filter-toggle
    filterCheckbox.checked = def.showInFilters ?? true;

    // Restore chipList fields
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      }
    }
  }

  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
