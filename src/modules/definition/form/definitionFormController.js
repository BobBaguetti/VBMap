// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.6 — force-refresh Pickr + swatch backgrounds on populate

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

  // Initialize Pickr instances
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  // Build submission payload (incl. showInFilters)
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

  // Reset inputs + swatches
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.values(colorables).forEach(btn => {
      btn.style.backgroundColor = "";
    });
  }

  // Populate inputs, Pickr, **and** swatch backgrounds
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

    formState.populate(sanitized);

    // Force‐refresh each pickr + paint its button
    for (const [fieldKey, cfg] of Object.entries(schema)) {
      if (!cfg.colorable) continue;
      const colorProp = cfg.colorable;
      const savedColor = def[colorProp] ?? null;
      const pr = pickrs[colorProp];
      const btn = colorables[colorProp];

      if (pr && savedColor) {
        // 1) set with silent flag
        pr.setColor(savedColor, true);

        // 2) force internal apply if available
        if (typeof pr.applyColor === "function") {
          pr.applyColor();
        }

        // 3) manually paint the swatch element
        if (btn) {
          // inline !important to override any CSS
          btn.setAttribute(
            "style",
            `background-color: ${savedColor} !important;`
          );
        }
      }
    }

    filterCheckbox.checked = def.showInFilters ?? true;

    // chipList fields
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
    initPickrs: () =>
        Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
