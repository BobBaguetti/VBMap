// @file: src/modules/ui/forms/controllers/itemFormController.js
// @version: 4.40 — DRY form event wiring via shared shell

import { createPickr }                         from "../../pickrManager.js";
import { getPickrHexColor, applyColorPresets } from "../../../utils/colorUtils.js";
import { createItemForm }                      from "../builders/itemFormBuilder.js";
import { createIcon }                          from "../../../utils/iconUtils.js";
import { createFormControllerHeader, wireFormEvents } from "../../components/formControllerShell.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles wiring, reset, populate, live preview hooks, and getCustom logic.
 *
 * @param {object} callbacks
 * @param {function} callbacks.onCancel
 * @param {function} callbacks.onSubmit
 * @param {function} callbacks.onDelete
 * @param {function} [callbacks.onFieldChange] — called with getCustom() on any field change
 */
export function createItemFormController({ onCancel, onSubmit, onDelete, onFieldChange }) {
  const { form, fields } = createItemForm();
  const pickrs = {};
  let _id = null;

  // ─── Shared header + buttons ───────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    filterCheckbox: chkAddFilter,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Item",
    hasFilter: true,
    onFilter:  _checked => onFieldChange?.(getCustom()),
    onCancel,
    onDelete: () => {
      if (_id != null && confirm(`Delete "${fields.fldName.value}"?`)) {
        onDelete?.(_id);
      }
    }
  });

  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Pickr Initialization ──────────────────────────────────────────
  function initPickrs() {
    const map = {
      name:        fields.colorName,
      itemType:    fields.colorType,
      rarity:      fields.colorRarity,
      description: fields.colorDesc,
      value:       fields.colorValue,
      quantity:    fields.colorQty
    };
    Object.entries(map).forEach(([key, btn]) => {
      if (!pickrs[key] && document.body.contains(btn)) {
        const p = createPickr(`#${btn.id}`);
        pickrs[key] = p;
        p.on("change", () => form.dispatchEvent(new Event("input", { bubbles: true })));
        p.on("save",   () => form.dispatchEvent(new Event("input", { bubbles: true })));
        btn.addEventListener("click", () => p.show());
      }
    });
  }
  initPickrs();

  // ─── Sync Presets on Rarity or Type Change ─────────────────────────
  function applyPresetsAndRefresh() {
    if (!fields.fldType.value || !fields.fldRarity.value) return;
    initPickrs();
    const tmp = { itemType: fields.fldType.value, rarity: fields.fldRarity.value };
    applyColorPresets(tmp);
    tmp.nameColor = tmp.nameColor || tmp.rarityColor || tmp.itemTypeColor;

    setTimeout(() => {
      pickrs.name     && tmp.nameColor      && pickrs.name.setColor(tmp.nameColor);
      pickrs.itemType && tmp.itemTypeColor  && pickrs.itemType.setColor(tmp.itemTypeColor);
      pickrs.rarity   && tmp.rarityColor    && pickrs.rarity.setColor(tmp.rarityColor);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }
  fields.fldType .addEventListener("change", applyPresetsAndRefresh);
  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);

  // ─── Reset to Add mode ─────────────────────────────────────────────
  function reset() {
    form.reset();
    chkAddFilter.checked   = false;
    fields.fldType.value   = "";
    fields.fldRarity.value = "";
    fields.extraInfo.setLines([], false);
    _id = null;
    subheading.textContent = "Add Item";
    setDeleteVisible(false);
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
  }

  // ─── Populate for Edit mode ────────────────────────────────────────
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

    initPickrs();
    pickrs.name        && def.nameColor        && pickrs.name.setColor(def.nameColor);
    pickrs.itemType    && def.itemTypeColor    && pickrs.itemType.setColor(def.itemTypeColor);
    pickrs.rarity      && def.rarityColor      && pickrs.rarity.setColor(def.rarityColor);
    pickrs.description && def.descriptionColor && pickrs.description.setColor(def.descriptionColor);
    pickrs.value       && def.valueColor       && pickrs.value.setColor(def.valueColor);
    pickrs.quantity    && def.quantityColor    && pickrs.quantity.setColor(def.quantityColor);
  }

  // ─── Gather form data ──────────────────────────────────────────────
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

  // ─── Wire form submission & live‐preview events ───────────────────
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    initPickrs,
    getCurrentPayload: getCustom,
    getCustom
  };
}
