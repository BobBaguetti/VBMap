// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.4 — read/write native <input type="color"> values

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";

/**
 * Wraps a schema-built form, wiring header, state, and events.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title, hasFilter,
    onCancel, onSubmit,
    onDelete, onFieldChange
  } = handlers;

  // Header + Filter & Buttons
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

  // Build payload from all fields including colors
  function getPayload() {
    const out = { id: payloadId };
    for (const [key, cfg] of Object.entries(schema)) {
      let val;
      const el = fields[key];
      switch (cfg.type) {
        case "checkbox":    val = el.checked; break;
        case "extraInfo":   val = el.getLines(); break;
        case "chipList":    val = el.get();      break;
        default:            val = el.value;
      }
      out[key] = val;
      if (cfg.colorable) {
        out[cfg.colorable] = colorables[cfg.colorable].value;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // Optionally apply preset colors when selects change
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      fields[key].addEventListener("change", () => {
        let preset;
        if (key === "rarity") {
          preset = rarityColors[fields.rarity.value];
          if (preset) {
            colorables.rarityColor.value = preset;
            colorables.nameColor.value   = preset;
          }
        } else if (key === "itemType") {
          preset = itemTypeColors[fields.itemType.value];
          if (preset) {
            colorables.itemTypeColor.value = preset;
          }
        }
        form.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });

  // Form state management
  const defaultValues = Object.fromEntries(
    Object.entries(schema).map(([k, cfg]) => {
      let dv = cfg.default;
      if (dv === undefined) dv = cfg.type === "checkbox" ? false : "";
      return [k, dv];
    })
  );
  const colorKeys = Object.entries(schema)
    .filter(([, cfg]) => cfg.colorable)
    .map(([, cfg]) => cfg.colorable);

  const formState = createFormState({
    form,
    fields,
    defaultValues,
    // colorables now native inputs, passed as pickrs
    pickrs:    colorables,
    pickrClearKeys: colorKeys,
    subheading,
    setDeleteVisible,
    getCustom: getPayload,
    onFieldChange
  });

  // Reset form and colors
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([k, cfg]) => {
      if (cfg.type === "extraInfo") fields[k].setLines([]);
    });
    colorKeys.forEach(k => colorables[k].value = "#E5E6E8");
  }

  // Populate form and native color inputs
  async function populate(def) {
    payloadId = def.id ?? null;
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // Set each saved color or default
    colorKeys.forEach(key => {
      colorables[key].value = def[key] || "#E5E6E8";
    });

    // Handle chipList & extraInfo
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

    // Apply preset fallback if no saved color
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

  return {
    form,
    reset,
    populate,
    getPayload
  };
}
