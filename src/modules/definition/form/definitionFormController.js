// @file: src/modules/definition/form/definitionFormController.js
// @version: 1.9.3 — now respects saved custom colors on load

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs, getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";

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

  // Auto-apply preset colors when selects change
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const selectEl = fields[key];
      selectEl.addEventListener("change", () => {
        let preset;
        if (key === "rarity") {
          preset = rarityColors[selectEl.value];
          if (preset) {
            pickrs["rarityColor"]?.setColor(preset);
            pickrs["nameColor"]?.setColor(preset);
          }
        } else if (key === "itemType") {
          preset = itemTypeColors[selectEl.value];
          if (preset) {
            pickrs["itemTypeColor"]?.setColor(preset);
          }
        }
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

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

  // ─── Defaults & State ────────────────────────────────────────────────────────
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
    // clear any extraInfo rows
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // only pick the schema keys for actual inputs
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

    // use the sanitized values for native form inputs
    formState.populate(sanitized);
    filterCheckbox.checked = def.showInFilters ?? true;

    // multi-part fields (chipList, extraInfo)
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(sanitized[key])) {
        fields[key].set(sanitized[key]);
      } else if (cfg.type === "extraInfo") {
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

    // ─── NEW: first load any saved custom colors ───────────────────────────────
    Object.entries(pickrs).forEach(([colorKey, p]) => {
      if (def[colorKey]) {
        p.setColor(def[colorKey]);
      }
    });

    // ─── THEN fall back to the default presets if no custom color was saved ────
    if (schema.rarity) {
      const preset = rarityColors[sanitized.rarity];
      if (preset) {
        if (!def.rarityColor) {
          pickrs["rarityColor"]?.setColor(preset);
        }
        if (!def.nameColor) {
          pickrs["nameColor"]?.setColor(preset);
        }
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[sanitized.itemType];
      if (preset && !def.itemTypeColor) {
        pickrs["itemTypeColor"]?.setColor(preset);
      }
    }
  }

  // ─── Wire Events & Save Handler ───────────────────────────────────────────────
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
