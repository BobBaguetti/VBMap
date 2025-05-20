// @file: src/modules/definition/forms/definitionFormController.js
// @version: 2.3 — log DEF vs PICKRS keys to debug swatch wiring

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

  const { container: headerWrap, subheading, filterCheckbox, setDeleteVisible }
    = createFormControllerHeader({ title, hasFilter: !!hasFilter, onFilter: () => onFieldChange?.(getPayload()), onCancel, onDelete });

  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // pickr instances
  const pickrs = {};
  function initPickrs() {
    Object.assign(pickrs, initFormPickrs(form, colorables));
  }

  // preset coloring on selects
  Object.entries(schema).forEach(([key, cfg]) => {
    if (cfg.type === "select" && cfg.colorable) {
      fields[key].addEventListener("change", () => {
        if (key === "rarity") {
          const preset = rarityColors[fields.rarity.value];
          if (preset) {
            pickrs.rarityColor?.setColor(preset);
            pickrs.nameColor?.setColor(preset);
          }
        } else if (key === "itemType") {
          const preset = itemTypeColors[fields.itemType.value];
          if (preset) pickrs.itemTypeColor?.setColor(preset);
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
      if (cfg.type === "checkbox") val = el.checked;
      else if (cfg.type === "extraInfo") val = el.getLines();
      else if (cfg.type === "chipList") val = el.get();
      else val = el.value;
      out[key] = val;
      if (cfg.colorable) {
        const p = pickrs[cfg.colorable];
        out[cfg.colorable] = p ? getPickrHexColor(p) : null;
      }
    }
    out.showInFilters = filterCheckbox.checked;
    return out;
  }

  // form state
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
    form, fields, defaultValues, pickrs, pickrClearKeys,
    subheading, setDeleteVisible, getCustom: getPayload,
    onFieldChange
  });

  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([k, cfg]) => {
      if (cfg.type === "extraInfo") fields[k].setLines([]);
    });
    pickrClearKeys.forEach(k => pickrs[k]?.setColor("#E5E6E8"));
  }

  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) wire up swatches
    initPickrs();

    // 2) fill form
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 3) DEBUG: log keys
    console.group("Definition Colors Debug");
    console.log("DEF keys:", Object.keys(def));
    console.log("PICKRS keys:", Object.keys(pickrs));
    // 4) explicitly apply saved colors
    Object.entries(def).forEach(([key, val]) => {
      if (val && pickrs[key]) {
        console.log(`Applying ${key} → ${val}`);
        pickrs[key].setColor(val);
      }
    });
    console.groupEnd();

    // 5) chipList & extraInfo
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

    // 6) fallback presets
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        if (!def.rarityColor) pickrs.rarityColor?.setColor(preset);
        if (!def.nameColor) pickrs.nameColor?.setColor(preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset && !def.itemTypeColor) {
        pickrs.itemTypeColor?.setColor(preset);
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
    form, reset, populate, getPayload, initPickrs
  };
}
