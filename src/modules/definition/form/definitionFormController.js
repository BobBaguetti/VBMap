// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.8 — guard Pickr root querySelector to prevent errors on reset

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

  // Schema defaults & pickr-clear keys
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

  // Reset inputs + swatches + Pickr preview buttons
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;

    // Clear swatch button backgrounds
    Object.values(colorables).forEach(btn => {
      btn.style.backgroundColor = "";
    });

    // Safely clear Pickr preview buttons if they exist
    Object.values(pickrs).forEach(p => {
      const root = p.getRoot?.();
      if (root && typeof root.querySelector === "function") {
        const previewBtn = root.querySelector(".pcr-button");
        if (previewBtn) {
          previewBtn.style.backgroundColor = "";
        }
      }
    });
  }

  // Populate fields, Pickr + swatches
  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized payload for formState
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

    formState.populate(sanitized);

    // Apply each color to swatch button
    Object.entries(schema).forEach(([fieldKey, cfg]) => {
      if (!cfg.colorable) return;
      const colorProp = cfg.colorable;
      const savedColor = def[colorProp] || null;
      const btn         = colorables[colorProp];
      const pr          = pickrs[colorProp];

      if (savedColor) {
        // Paint the swatch button
        if (btn) {
          btn.style.backgroundColor = savedColor;
        }
        // Also update Pickr preview if available
        if (pr) {
          const root = pr.getRoot?.();
          if (root && typeof root.querySelector === "function") {
            const previewBtn = root.querySelector(".pcr-button");
            if (previewBtn) {
              previewBtn.style.backgroundColor = savedColor;
            }
          }
        }
      }
    });

    // Restore the showInFilters toggle
    filterCheckbox.checked = def.showInFilters ?? true;

    // Restore chipList fields
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      }
    });
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
