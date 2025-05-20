// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.1 — reinitialize Pickrs on populate using data-default-color

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs, destroyAllPickrs, getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";

export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header + filter & buttons
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

  // We will initPickrs on each populate, so no initial call here

  let pickrs = {};
  let payloadId = null;

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
        // ensure pickrs is up-to-date
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p
          ? getPickrHexColor(p)
          : null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Form State defaults
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
      return [k, dv];
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
    // clear extra info
    for (const [k, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[k].setLines([]);
      }
    }
    // destroy pickrs so next populate re-inits
    destroyAllPickrs();
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // sanitized base
    const sanitized = {};
    for (const [k, cfg] of Object.entries(schema)) {
      sanitized[k] = def[k] !== undefined
        ? def[k]
        : cfg.default !== undefined
          ? cfg.default
          : cfg.type === "checkbox"
            ? false
            : "";
    }

    // populate simple fields & subheader
    formState.populate(sanitized);
    filterCheckbox.checked = def.showInFilters ?? true;

    // clear old pickrs before re-init
    destroyAllPickrs();

    // set data-default-color on each button
    for (const [k, cfg] of Object.entries(schema)) {
      if (cfg.colorable) {
        const btn = colorables[cfg.colorable];
        const saved = def[cfg.colorable] ?? cfg.default ?? "#E5E6E8";
        if (btn) {
          btn.dataset.defaultColor = saved;
          btn.style.backgroundColor = saved;
        }
      }
    }

    // now initialize Pickrs with correct defaults
    pickrs = initFormPickrs(form, colorables);

    // chipList and extraInfo
    for (const [k, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[k])) {
        fields[k].set(sanitized[k]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(sanitized[k]) && sanitized[k]
          ? sanitized[k]
          : Array.isArray(def.extraInfo) && def.extraInfo
            ? def.extraInfo
            : [];
        fields[k].setLines(lines);
      }
    }
  }

  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  // ensure Save always fires
  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit?.(getPayload());
    });
  }

  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () => (pickrs = initFormPickrs(form, colorables))
  };
}
