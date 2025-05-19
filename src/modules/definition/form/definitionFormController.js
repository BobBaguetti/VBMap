// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.4.10 — use Pickr sync to paint swatches, initial load paints too

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs } from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";

export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header & buttons (incl. showInFilters toggle)
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

  // 1) Initialize Pickr instances & wiring
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  // 2) Build the save payload (including colors & showInFilters)
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":  val = el.checked;    break;
        case "extraInfo": val = el.getLines();  break;
        case "chipList":  val = el.get();       break;
        default:          val = el.value;
      }
      out[key] = val;
      if (cfg.colorable) {
        const col = pickrs[cfg.colorable]?.getColor?.()?.toHEXA?.().toString?.() || null;
        out[cfg.colorable] = col;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // 3) Schema defaults for formState
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

  // 4) Wire form state
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

  // 5) Reset: clear inputs, toggle, and swatches
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.values(colorables).forEach(btn => {
      btn.style.backgroundColor = "";
    });
  }

  // 6) Populate: load fields + paint initial swatches + restore toggle
  async function populate(def) {
    payloadId = def.id ?? null;

    // sanitize based on schema defaults
    const sanitized = {};
    for (const [key, cfg] of Object.entries(schema)) {
      sanitized[key] = def[key] !== undefined
        ? def[key]
        : (cfg.default !== undefined
            ? cfg.default
            : (cfg.type === "checkbox" ? false : ""));
    }
    formState.populate(sanitized);

    // paint each colorable button, and update Pickr’s internal color
    Object.entries(schema).forEach(([fieldKey, cfg]) => {
      if (!cfg.colorable) return;
      const colorProp = cfg.colorable;
      const savedColor = def[colorProp] ?? null;
      const btn = colorables[colorProp];
      const pr  = pickrs[colorProp];

      if (savedColor && btn) {
        // paint the swatch
        btn.style.backgroundColor = savedColor;
        // tell Pickr about it too
        pr?.setColor?.(savedColor);
      }
    });

    // restore filter toggle
    filterCheckbox.checked = def.showInFilters ?? true;

    // chipList fields
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
