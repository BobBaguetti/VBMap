// @file: src/modules/definition/forms/definitionFormController.js
// @version: 1.9.9 — include payloadId so edits update existing entries

import { createFormControllerHeader, wireFormEvents }
  from "../form/controller/formControllerShell.js";
import { createFormState }
  from "../form/controller/formStateManager.js";
import { rarityColors, itemTypeColors }
  from "../../../shared/utils/color/colorPresets.js";
import { CHEST_RARITY }
  from "../../map/marker/utils.js";
import { applyChestRarityLink }
  from "../form/controller/chestFormEnhancements.js";
import {
  setupPickrs,
  populateSavedColors
} from "../form/controller/formPickrManager.js";
import { populateMultiFields }
  from "../form/controller/formMultiFieldManager.js";
import { createGetPayload }
  from "../form/controller/formPayloadBuilder.js";

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

  // ─── Header + Filter & Buttons ─────────────────────────────────────────────
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = createFormControllerHeader({
    title,
    hasFilter: !!hasFilter,
    onFilter: () => onFieldChange(getPayload()),
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

  // ─── Init Pickr instances & wiring ─────────────────────────────────────────
  const pickrs = setupPickrs(form, fields, colorables, schema);

  // Chest-specific: auto-link nameColor to computed rarity
  applyChestRarityLink(fields, pickrs);

  // ─── Payload builder (wrapped to include id) ────────────────────────────────
  let payloadId = null;
  const rawGetPayload = createGetPayload(fields, schema, pickrs, filterCheckbox);
  function getPayload() {
    const out = rawGetPayload();
    out.id = payloadId;
    return out;
  }

  // ─── Defaults & Form State ─────────────────────────────────────────────────
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

  // ─── Reset & Populate ───────────────────────────────────────────────────────
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

    // 1) Basic populate
    formState.populate(def);
    filterCheckbox.checked = def.showInFilters ?? true;

    // 2) Multi-part fields
    populateMultiFields(fields, schema, def);

    // 3) Apply saved Firestore colors
    populateSavedColors(pickrs, def, schema);

    // 4) Select-presets for rarity & itemType
    if (schema.rarity) {
      const preset = rarityColors[def.rarity];
      if (preset) {
        pickrs["rarityColor"]?.setColor(preset);
        pickrs["nameColor"]?.setColor(preset);
      }
    }
    if (schema.itemType) {
      const preset = itemTypeColors[def.itemType];
      if (preset) pickrs["itemTypeColor"]?.setColor(preset);
    }
  }

  // ─── Wire Events & Save Handler ─────────────────────────────────────────────
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);
  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit(getPayload());
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  return {
    form,
    reset,
    populate,
    getPayload,
    initPickrs: () =>
      Object.assign(pickrs, setupPickrs(form, fields, colorables, schema))
  };
}
