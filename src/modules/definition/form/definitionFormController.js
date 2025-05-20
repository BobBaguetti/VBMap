// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.4 — update swatch backgrounds when applying colors

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { initFormPickrs, getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState } from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";

export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const { title, hasFilter, onCancel, onSubmit, onDelete, onFieldChange } = handlers;

  // Header + Buttons
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

  // Pickr instances map
  const pickrs = {};
  function initPickrs() {
    Object.assign(pickrs, initFormPickrs(form, colorables));
  }

  // Preset coloring on select change
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      fields[key].addEventListener("change", () => {
        let preset;
        if (key === "rarity") {
          preset = rarityColors[fields.rarity.value];
          if (preset) {
            applyColor("rarityColor", preset);
            applyColor("nameColor",   preset);
          }
        } else if (key === "itemType") {
          preset = itemTypeColors[fields.itemType.value];
          if (preset) applyColor("itemTypeColor", preset);
        }
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  let payloadId = null;
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      if (cfg.type === "checkbox")      val = el.checked;
      else if (cfg.type === "extraInfo")val = el.getLines();
      else if (cfg.type === "chipList") val = el.get();
      else                              val = el.value;
      out[key] = val;
      if (cfg.colorable) {
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p ? getPickrHexColor(p) : null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Helper to set both Pickr and swatch bg
  function applyColor(key, hex) {
    if (pickrs[key]) pickrs[key].setColor(hex);
    if (colorables[key]) {
      colorables[key].style.backgroundColor = hex;
    }
  }

  // Form state
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

  // Reset & Populate
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([k, cfg]) => {
      if (cfg.type === "extraInfo") fields[k].setLines([]);
    });
    pickrClearKeys.forEach(k => applyColor(k, "#E5E6E8"));
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    initPickrs();
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // Explicitly apply saved colors
    Object.entries(def).forEach(([key, val]) => {
      if (val && pickrs[key]) {
        applyColor(key, val);
      }
    });

    // ChipList & ExtraInfo
    Object.entries(schema).forEach(([k, cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(def[k])) {
        fields[k].set(def[k]);
      } else if (cfg.type === "extraInfo") {
        const lines = Array.isArray(def.extraLines)
          ? def.extraLines
          : Array.isArray(def.extraInfo)
            ? def.extraInfo
            : [];
        fields[k].setLines(lines);
      }
    });

    // Fallback presets if no saved color
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        if (!def.rarityColor) applyColor("rarityColor", preset);
        if (!def.nameColor)   applyColor("nameColor",   preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset && !def.itemTypeColor) {
        applyColor("itemTypeColor", preset);
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
    initPickrs
  };
}
