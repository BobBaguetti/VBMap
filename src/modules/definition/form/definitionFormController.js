// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.6-populate-refactor — uses populateFields helper

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { getPickrHexColor }
  from "../form/controller/pickrAdapter.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import {
  rarityColors,
  itemTypeColors
} from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }
  from "../../map/marker/utils.js";
import { applyChestRarityLink }
  from "../form/controller/chestFormEnhancements.js";
import {
  setupPickrs,
  populateSavedColors
} from "../form/controller/formPickrManager.js";
import { populateFields } 
  from "../form/controller/populateFields.js";

/**
 * Wraps a schema-built form, wiring header, state, events, and Pickr.
 */
export function createFormController(buildResult, schema, handlers) {
  const { form, fields, colorables } = buildResult;
  const {
    title,
    hasFilter,
    onCancel,
    onSubmit,
    onDelete,
    onFieldChange
  } = handlers;

  // Header + subheader
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

  // Init all Pickr instances
  const pickrs = setupPickrs(form, fields, colorables, schema);

  // Chest-specific nameColor linking
  applyChestRarityLink(fields, pickrs);

  let payloadId = null;

  // Build payload
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

  // State setup
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

  // Reset
  function reset() {
    payloadId = null;
    formState.reset();
    filterCheckbox.checked = true;
    Object.entries(schema).forEach(([key, cfg]) => {
      if (cfg.type === "extraInfo") {
        fields[key].setLines([]);
      }
    });
  }

  // Populate
  async function populate(def) {
    payloadId = def.id ?? null;

    // 1) Basic populate for simple fields
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields (chipList & extraInfo)
    populateFields(fields, schema, def);

    // 3) Apply saved colors
    populateSavedColors(pickrs, def, schema);

    // 4) Auto-presets
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        pickrs["rarityColor"]?.setColor(preset);
        pickrs["nameColor"]?.setColor(preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset) {
        pickrs["itemTypeColor"]?.setColor(preset);
      }
    }
  }

  // Wire and return API
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);
  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit?.(getPayload());
    });
  }

  return { form, reset, populate, getPayload,
    initPickrs: () => setupPickrs(form, fields, colorables, schema)
  };
}
