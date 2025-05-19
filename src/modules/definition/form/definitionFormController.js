// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.9 — force inline !important styling on swatches

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

  // Init Pickr instances
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      const el = fields[key];
      let val;
      switch (cfg.type) {
        case "checkbox":  val = el.checked;    break;
        case "extraInfo": val = el.getLines();  break;
        case "chipList":  val = el.get();       break;
        default:          val = el.value;
      }
      out[key] = val;
      if (cfg.colorable) {
        out[cfg.colorable] = pickrs[cfg.colorable]?.getColor() || null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

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

  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    // Clear inline backgrounds
    Object.values(colorables).forEach(btn => {
      btn.style.removeProperty("background-color");
    });
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Sanitize for formState
    const sanitized = {};
    for (const [key, cfg] of Object.entries(schema)) {
      sanitized[key] = def[key] !== undefined
        ? def[key]
        : (cfg.default !== undefined
            ? cfg.default
            : (cfg.type === "checkbox" ? false : ""));
    }
    formState.populate(sanitized);

    // Apply saved colors
    Object.entries(schema).forEach(([fieldKey, cfg]) => {
      if (!cfg.colorable) return;
      const colorProp = cfg.colorable;
      const savedColor = def[colorProp] ?? null;
      const pr  = pickrs[colorProp];
      const btn = colorables[colorProp];

      if (savedColor) {
        // Try updating Pickr internals
        if (pr?.setColor) {
          pr.setColor(savedColor);
        }
        // Force the button background with !important
        if (btn) {
          btn.style.setProperty(
            "background-color",
            savedColor,
            "important"
          );
        }
      }
    });

    filterCheckbox.checked = def.showInFilters ?? true;

    // Restore chipList
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
    initPickrs: () =>
      Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
