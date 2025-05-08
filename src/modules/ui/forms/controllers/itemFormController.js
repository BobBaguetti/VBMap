// @file: src/modules/ui/forms/controllers/itemFormController.js
// @version: 4.45 — fix extra-info populate ordering

import { getPickrHexColor, applyColorPresets } from "../../../utils/colorUtils.js";
import { createItemForm }                      from "../builders/itemFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                              from "../../components/formControllerShell.js";
import { initFormPickrs }                     from "../../components/formPickrManager.js";
import { createFormState }                    from "../../components/formStateManager.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createItemFormController({
  onCancel,
  onSubmit,
  onDelete,
  onFieldChange
}) {
  const { form, fields } = createItemForm();

  // ─── Header + Buttons ───────────────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    filterCheckbox: chkAddFilter,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Item",
    hasFilter: true,
    onFilter:  () => onFieldChange?.(getCustom()),
    onCancel,
    onDelete:  () => {
      if (_id != null && confirm(`Delete "${fields.fldName.value}"?`)) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Pickr wiring ───────────────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    itemType:    fields.colorType,
    rarity:      fields.colorRarity,
    description: fields.colorDesc,
    value:       fields.colorValue,
    quantity:    fields.colorQty
  });

  // ─── Auto‐apply presets on type/rarity change ───────────────────────
  function applyPresetsAndRefresh() {
    if (!fields.fldType.value || !fields.fldRarity.value) return;
    const tmp = {
      itemType: fields.fldType.value,
      rarity:   fields.fldRarity.value
    };
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

  // ─── Internal state & payload getter ───────────────────────────────
  let _id = null;
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

  // ─── Shared reset & populate via formStateManager ────────────────
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      itemType:    fields.fldType,
      rarity:      fields.fldRarity,
      description: fields.fldDesc,
      value:       fields.fldValue,
      quantity:    fields.fldQty,
      imageSmall:  fields.fldImgS,
      imageLarge:  fields.fldImgL
    },
    defaultFieldKeys: [
      "name","itemType","rarity",
      "description","value","quantity",
      "imageSmall","imageLarge"
    ],
    pickrs,
    pickrClearKeys: [
      "name","itemType","rarity",
      "description","value","quantity"
    ],
    subheading,
    setDeleteVisible,
    addTitle:  "Add Item",
    editTitle: "Edit Item",
    getCustom,
    onFieldChange
  });

  // ─── Wrap reset/populate to include extra-info & ID ───────────────
  function reset() {
    chkAddFilter.checked = false;
    fields.extraInfo.setLines([], false);
    _id = null;
    _reset();
  }

  function populate(def) {
    _id = def.id || null;
    _populate(def);
    chkAddFilter.checked = !!def.showInFilters;
    // **restore extra-info lines after core populate**
    fields.extraInfo.setLines(def.extraLines || [], false);
  }

  // ─── Wire submission & live preview ───────────────────────────────
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    initPickrs: () =>
      Object.assign(
        pickrs,
        initFormPickrs(form, {
          name:        fields.colorName,
          itemType:    fields.colorType,
          rarity:      fields.colorRarity,
          description: fields.colorDesc,
          value:       fields.colorValue,
          quantity:    fields.colorQty
        })
      ),
    getCustom,
    getCurrentPayload: getCustom
  };
}
