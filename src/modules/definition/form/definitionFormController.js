// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.6 — auto-apply chest nameColor based on category+size

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs, getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY } from "../../../map/marker/utils.js";

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

  // ─── Auto-apply preset colors when selects change ─────────────────────────────
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      const selectEl = fields[key];
      selectEl.addEventListener("change", () => {
        let preset;

        // Existing per-field presets
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
        // ─── NEW: Chest definitions derive rarity from category+size ──────
        else if (title === "Chest" && (key === "category" || key === "size")) {
          const cat = fields.category.value;
          const sz  = fields.size.value;
          const rarKey = CHEST_RARITY[cat]?.[sz];
          preset = rarityColors[rarKey];
          if (preset) {
            // only bump the name (no stored rarity field)
            pickrs["nameColor"]?.setColor(preset);
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
        out[cfg.colorable] = p ? getPickrHexColor(p) : null;
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
    for (const [key, cfg] of Object.entries(schema)) {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    }
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // Build sanitized data for form fields
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

    // Populate input fields
    formState.populate(sanitized);
    filterCheckbox.checked = def.showInFilters ?? true;

    // Populate multi-part fields
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

    // ─── Apply saved colors to pickr instances ───────────────────────────────
    setTimeout(() => {
      Object.entries(schema).forEach(([key, cfg]) => {
        if (cfg.colorable) {
          const colorKey = cfg.colorable;
          const saved = def[colorKey];
          if (saved && pickrs[colorKey]) {
            pickrs[colorKey].setColor(saved);
          }
        }
      });

      // Also re-apply chest nameColor from def if present
      if (title === "Chest") {
        const cat = def.category;
        const sz  = def.size;
        const rarKey = CHEST_RARITY[cat]?.[sz];
        const preset = rarityColors[rarKey];
        if (preset) {
          pickrs["nameColor"]?.setColor(preset);
        }
      }
    }, 0);

    // Apply presets on populate for rarity & itemType (unchanged)
    if (schema.rarity) {
      const preset = rarityColors[sanitized.rarity];
      if (preset) {
        pickrs["rarityColor"]?.setColor(preset);
        pickrs["nameColor"]?.setColor(preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[sanitized.itemType];
      if (preset) {
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
