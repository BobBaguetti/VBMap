// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.0 — apply loaded colors to swatch backgrounds as well as Pickr

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs, getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // ─── Header + Filter & Buttons ───────────────────────────────────────────────
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

  // Initialize Pickr on colorable fields
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  // ─── Build submission payload ────────────────────────────────────────────────
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

      // Serialize Pickr color to hex string
      if (cfg.colorable) {
        const pickr = pickrs[cfg.colorable];
        out[cfg.colorable] = pickr
          ? getPickrHexColor(pickr)
          : null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // ─── Defaults & Form State ───────────────────────────────────────────────────
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

  // ─── Reset & Populate ────────────────────────────────────────────────────────
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;

    // Reset extraInfo and color swatches
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
      if (cfg.colorable) {
        const btn = colorables[cfg.colorable];
        const pickr = pickrs[cfg.colorable];
        const defaultColor = cfg.default || "#E5E6E8";
        if (pickr) pickr.setColor(defaultColor);
        if (btn)   btn.style.backgroundColor = defaultColor;
      }
    });
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized object (never undefined)
    const sanitized = {};
    Object.entries(schema).forEach(([key, cfg]) => {
      if (def[key] !== undefined) {
        sanitized[key] = def[key];
      } else if (cfg.default !== undefined) {
        sanitized[key] = cfg.default;
      } else {
        sanitized[key] = cfg.type === "checkbox" ? false : "";
      }
    });

    // Populate basic fields & subheader
    formState.populate(sanitized);
    filterCheckbox.checked = def.showInFilters ?? true;

    // Initialize and display saved colors
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.colorable) {
        const saved = def[cfg.colorable] ?? cfg.default ?? "#E5E6E8";
        const pickr = pickrs[cfg.colorable];
        const btn   = colorables[cfg.colorable];
        if (pickr) pickr.setColor(saved);
        if (btn)   btn.style.backgroundColor = saved;
      }
    });

    // Wire chipList and extraInfo fields
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(sanitized[key]) && sanitized[key]
          ? sanitized[key]
          : Array.isArray(def.extraInfo) && def.extraInfo
            ? def.extraInfo
            : [];
        fields[key].setLines(lines);
      }
    });
  }

  // ─── Events & Save Button ────────────────────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit?.(getPayload());
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
