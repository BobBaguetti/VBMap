// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.5 — guard colorable inputs in getPayload()

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";

export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title, hasFilter,
    onCancel, onSubmit,
    onDelete, onFieldChange
  } = handlers;

  // Header & Buttons
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

  let payloadId = null;

  // Build submission payload, safely reading colorables
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
        // safe: colorables[cfg.colorable] might be undefined
        const colorEl = colorables[cfg.colorable];
        out[cfg.colorable] = colorEl?.value ?? "#E5E6E8";
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Preset color on select change
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      fields[key].addEventListener("change", () => {
        if (key === "rarity") {
          const preset = rarityColors[fields.rarity.value];
          if (preset) {
            colorables.rarityColor.value = preset;
            colorables.nameColor.value   = preset;
          }
        } else if (key === "itemType") {
          const preset = itemTypeColors[fields.itemType.value];
          if (preset) colorables.itemTypeColor.value = preset;
        }
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  // FormState setup
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k,cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type==="checkbox"? false : "";
      return [k, dv];
    })
  );
  const colorKeys = Object.entries(schema)
    .filter(([,cfg])=>cfg.colorable)
    .map(([,cfg])=>cfg.colorable);

  const formState = createFormState({
    form,
    fields,
    defaultValues,
    pickrs: colorables, // now raw <input type="color">
    pickrClearKeys: colorKeys,
    subheading,
    setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  // Reset including colorInputs
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([k,cfg])=>{
      if (cfg.type==="extraInfo") fields[k].setLines([]);
    });
    colorKeys.forEach(k => {
      colorables[k].value = "#E5E6E8";
    });
  }

  // Populate, setting colorInputs safely
  async function populate(def) {
    payloadId = def.id ?? null;
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // Set saved or default colors
    colorKeys.forEach(k => {
      colorables[k].value = def[k] ?? "#E5E6E8";
    });

    // ChipList & ExtraInfo wiring
    Object.entries(schema).forEach(([k,cfg])=>{
      if (cfg.type==="chipList" && Array.isArray(def[k])) {
        fields[k].set(def[k]);
      } else if (cfg.type==="extraInfo") {
        const lines = Array.isArray(def.extraLines)
          ? def.extraLines
          : Array.isArray(def.extraInfo)
            ? def.extraInfo
            : [];
        fields[k].setLines(lines);
      }
    });

    // Preset fallback where needed
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        if (!def.rarityColor) colorables.rarityColor.value = preset;
        if (!def.nameColor)   colorables.nameColor.value   = preset;
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset && !def.itemTypeColor) {
        colorables.itemTypeColor.value = preset;
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

  return { form, reset, populate, getPayload };
}
