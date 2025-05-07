// @file: src/modules/ui/forms/controllers/itemFormController.js
// @version: 4.41 — Pickr wiring factored into shared formPickrManager

import { getPickrHexColor, applyColorPresets } from "../../../utils/colorUtils.js";
import { createItemForm }                      from "../builders/itemFormBuilder.js";
import { createFormControllerHeader, wireFormEvents } from "../../components/formControllerShell.js";
import { initFormPickrs }                     from "../../components/formPickrManager.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles the shared header, DRY’d Pickr wiring, live‐preview hooks, and CRUD logic.
 *
 * @param {object} callbacks
 * @param {function} callbacks.onCancel
 * @param {function} callbacks.onSubmit
 * @param {function} callbacks.onDelete
 * @param {function} [callbacks.onFieldChange] — called with getCustom() on any field change
 */
export function createItemFormController({ onCancel, onSubmit, onDelete, onFieldChange }) {
  const { form, fields } = createItemForm();

  // ─── Shared header + buttons ───────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    filterCheckbox: chkAddFilter,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Item",
    hasFilter: true,
    onFilter:  checked => onFieldChange?.(getCustom()),
    onCancel,
    onDelete: () => {
      if (_id != null && confirm(`Delete "${fields.fldName.value}"?`)) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Shared Pickr wiring ───────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    itemType:    fields.colorType,
    rarity:      fields.colorRarity,
    description: fields.colorDesc,
    value:       fields.colorValue,
    quantity:    fields.colorQty
  });

  // ─── Sync presets on type/rarity change ────────────────────────────
  function applyPresetsAndRefresh() {
    if (!fields.fldType.value || !fields.fldRarity.value) return;

    const tmp = {
      itemType: fields.fldType.value,
      rarity:   fields.fldRarity.value
    };
    applyColorPresets(tmp);
    // fallback for name color
    tmp.nameColor = tmp.nameColor || tmp.rarityColor || tmp.itemTypeColor;

    // apply back into pickrs and trigger preview
    setTimeout(() => {
      pickrs.name     && tmp.nameColor      && pickrs.name.setColor(tmp.nameColor);
      pickrs.itemType && tmp.itemTypeColor  && pickrs.itemType.setColor(tmp.itemTypeColor);
      pickrs.rarity   && tmp.rarityColor    && pickrs.rarity.setColor(tmp.rarityColor);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }
  fields.fldType .addEventListener("change", applyPresetsAndRefresh);
  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);

  // ─── Internal state ────────────────────────────────────────────────
  let _id = null;

  // ─── Reset to “Add” mode ───────────────────────────────────────────
  function reset() {
    form.reset();
    chkAddFilter.checked   = false;
    fields.fldType.value   = "";
    fields.fldRarity.value = "";
    fields.extraInfo.setLines([], false);
    _id = null;
    subheading.textContent = "Add Item";
    setDeleteVisible(false);
    // reset all pickr swatches
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
  }

  // ─── Populate for “Edit” mode ──────────────────────────────────────
  function populate(def) {
    form.reset();
    chkAddFilter.checked   = !!def.showInFilters;
    fields.fldName.value   = def.name        || "";
    fields.fldType.value   = def.itemType    || "";
    fields.fldRarity.value = def.rarity      || "";
    fields.fldDesc.value   = def.description || "";
    fields.fldValue.value  = def.value       || "";
    fields.fldQty.value    = def.quantity    || "";
    fields.fldImgS.value   = def.imageSmall  || "";
    fields.fldImgL.value   = def.imageLarge  || "";
    fields.extraInfo.setLines(def.extraLines || [], false);

    _id = def.id || null;
    subheading.textContent = "Edit Item";
    setDeleteVisible(true);

    // apply saved colors
    pickrs.name        && def.nameColor        && pickrs.name.setColor(def.nameColor);
    pickrs.itemType    && def.itemTypeColor    && pickrs.itemType.setColor(def.itemTypeColor);
    pickrs.rarity      && def.rarityColor      && pickrs.rarity.setColor(def.rarityColor);
    pickrs.description && def.descriptionColor && pickrs.description.setColor(def.descriptionColor);
    pickrs.value       && def.valueColor       && pickrs.value.setColor(def.valueColor);
    pickrs.quantity    && def.quantityColor    && pickrs.quantity.setColor(def.quantityColor);
  }

  // ─── Collect form payload ──────────────────────────────────────────
  function getCustom() {
    return {
      id:               _id,
      showInFilters:    chkAddFilter.checked,
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      itemType:         fields.fldType.value,
      itemTypeColor:    getPickrHexColor(pickrs.itemType),
      rarity:           fields.fldRarity.value,
      rarityColor:      getPickrHexColor(pickrs.rarity),
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      value:            fields.fldValue.value.trim(),
      valueColor:       getPickrHexColor(pickrs.value),
      quantity:         fields.fldQty.value.trim(),
      quantityColor:    getPickrHexColor(pickrs.quantity),
      imageSmall:       fields.fldImgS.value.trim(),
      imageLarge:       fields.fldImgL.value.trim(),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  // ─── Wire submit & live‐preview hooks ─────────────────────────────
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getCustom,
    getCurrentPayload: getCustom
  };
}
