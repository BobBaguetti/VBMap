// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.1 — explicitly style the swatch buttons after setColor for consistent UI

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

  // Create Pickr instances on every color-btn
  const pickrs = initFormPickrs(form, colorables);

  let payloadId = null;

  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":      val = el.checked; break;
        case "extraInfo":     val = el.getLines(); break;
        case "chipList":      val = el.get();      break;
        default:              val = el.value;
      }
      out[key] = val;

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

  // Prepare defaults and formState
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([key, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
      return [key, dv];
    })
  );
  const colorKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  const formState = createFormState({
    form,
    fields,
    defaultValues,
    pickrs,
    pickrClearKeys: colorKeys,
    subheading,
    setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;

    // clear Pickr internals & swatch backgrounds
    colorKeys.forEach(key => {
      const pickr = pickrs[key];
      if (pickr) pickr.setColor(null);
      const btn = colorables[key];
      if (btn) btn.style.backgroundColor = "";
    });

    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // sanitized for formState
    const sanitized = {};
    for (const [key, cfg] of Object.entries(schema)) {
      if (def[key] !== undefined) sanitized[key] = def[key];
      else if (cfg.default !== undefined) sanitized[key] = cfg.default;
      else sanitized[key] = cfg.type === "checkbox" ? false : "";
    }

    formState.populate(sanitized);
    filterCheckbox.checked = def.showInFilters ?? true;

    // restore each Pickr + swatch BG
    colorKeys.forEach(key => {
      const pickr = pickrs[key];
      const btn   = colorables[key];
      const saved = def[key];
      if (pickr) {
        if (typeof saved === "string" && saved) {
          pickr.setColor(saved);
        } else {
          pickr.setColor(null);
        }
      }
      if (btn) {
        btn.style.backgroundColor =
          (typeof saved === "string" && saved) ? saved : "";
      }
    });

    // chipList
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(def.extraLines)
          ? def.extraLines
          : Array.isArray(def.extraInfo)
            ? def.extraInfo
            : [];
        fields[key].setLines(lines);
      }
    }
  }

  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

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
    initPickrs: () => Object.assign(pickrs, initFormPickrs(form, colorables))
  };
}
