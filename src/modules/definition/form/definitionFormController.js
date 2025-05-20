// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.0 — scoped Pickr init and deferred initialization for saved colors

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

  // ─── Prepare for scoped Pickr instances (deferred init) ────────────────────
  let pickrs = {};
  function initPickrs(initialColors = {}) {
    // Initialize Pickr on each color-btn inside the form,
    // using any saved color from initialColors or default.
    pickrs = initFormPickrs(form, colorables, initialColors);
  }

  // ─── Preset coloring on select change ────────────────────────────────────────
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
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p
          ? getPickrHexColor(p)
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
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
    // Reset pickr to defaults
    pickrClearKeys.forEach(key => {
      pickrs[key]?.setColor("#E5E6E8");
    });
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Initialize pickers now that the form is in DOM, using saved colors
    initPickrs(def);

    // 2) Populate all fields & Pickr from the full def (including colors)
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 3) Handle chipList & extraInfo
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        fields[key].set(def[key]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(def.extraLines)
          ? def.extraLines
          : Array.isArray(def.extraInfo)
            ? def.extraInfo
            : [];
        fields[key].setLines(lines);
      }
    }

    // 4) Fallback presets only if no saved colors
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        if (!def.rarityColor) pickrs["rarityColor"]?.setColor(preset);
        if (!def.nameColor)   pickrs["nameColor"]?.setColor(preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset && !def.itemTypeColor) {
        pickrs["itemTypeColor"]?.setColor(preset);
      }
    }
  }

  // ─── Events & Save Handler ──────────────────────────────────────────────────
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
    initPickrs
  };
}
