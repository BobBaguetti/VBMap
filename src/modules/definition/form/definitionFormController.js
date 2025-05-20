// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.8 — populate extraInfo fields with backward-compat for extraLines vs extraInfo

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

  // Prepend header (with Save/Clear/Delete) into the <form>
  form.prepend(headerWrap);

  // Initialize Pickr instances on any colorable fields
  const pickrs = initFormPickrs(form, colorables);

  // Track current definition ID
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
          // extraInfo API: el.getLines()
          val = el.getLines();
          break;
        case "chipList":
          val = el.get();
          break;
        default:
          val = el.value;
      }
      out[key] = val;

      // Serialize any Pickr color to hex string
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
    // Clear extraInfo lines if any
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized object (never undefined)
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
    filterCheckbox.checked = def.showInFilters ?? true;

    // Special wiring for multi-part fields
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      } else if (cfg.type === "extraInfo") {
        // Backwards-compat: some entries used def.extraLines, others def.extraInfo
        const fromExtraLines = Array.isArray(sanitized[key]) && sanitized[key];
        const fromLegacyInfo  = Array.isArray(def.extraInfo)  && def.extraInfo;
        const lines = fromExtraLines
          ? sanitized[key]
          : fromLegacyInfo
            ? def.extraInfo
            : [];
        fields[key].setLines(lines);
      }
    }
  }

  // ─── Wire Events & Ensure Save Works ────────────────────────────────────────
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
 