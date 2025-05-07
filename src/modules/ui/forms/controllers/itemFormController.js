// @file: src/modules/ui/forms/controllers/itemFormController.js
// @version: 4.43 — use shared formLogic for reset/populate/getCustom

import { getPickrHexColor, applyColorPresets }   from "../../../utils/colorUtils.js";
import { createItemForm }                        from "../builders/itemFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                                from "../../components/formControllerShell.js";
import { initFormPickrs }                       from "../../components/formPickrManager.js";
import { createFormLogic }                      from "../formLogicFactory.js";

export function createItemFormController({ onCancel, onSubmit, onDelete, onFieldChange }) {
  const { form, fields } = createItemForm();

  // header + buttons
  const {
    container: subheadingWrap,
    subheading,
    filterCheckbox: chkAddFilter,
    setDeleteVisible
  } = createFormControllerHeader({
    title:    "Add Item",
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

  // Pickr wiring
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    itemType:    fields.colorType,
    rarity:      fields.colorRarity,
    description: fields.colorDesc,
    value:       fields.colorValue,
    quantity:    fields.colorQty
  });

  // presets sync
  fields.fldType.addEventListener("change",  applyPresetsAndRefresh);
  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);
  function applyPresetsAndRefresh() {
    if (!fields.fldType.value || !fields.fldRarity.value) return;
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

  // formLogic: reset, populate, getCustom
  const { reset, populate, getCustom } = createFormLogic({
    form,
    fields,
    pickrs,
    checkboxField: chkAddFilter,
    extraInfoField: fields.extraInfo,
    properties: {
      checkbox: "showInFilters",
      fieldProps: {
        fldName: "name",
        fldType: "itemType",
        fldRarity: "rarity",
        fldDesc: "description",
        fldValue: "value",
        fldQty: "quantity",
        fldImgS: "imageSmall",
        fldImgL: "imageLarge"
      },
      pickrProps: {
        name:        "nameColor",
        itemType:    "itemTypeColor",
        rarity:      "rarityColor",
        description: "descriptionColor",
        value:       "valueColor",
        quantity:    "quantityColor"
      }
    },
    defaults: {
      fldType: "",
      fldRarity: ""
    }
  });

  // wire submit & live-preview
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return { form, reset, populate, getCustom, getCurrentPayload: getCustom, initPickrs: () => initFormPickrs(form, {
    name:        fields.colorName,
    itemType:    fields.colorType,
    rarity:      fields.colorRarity,
    description: fields.colorDesc,
    value:       fields.colorValue,
    quantity:    fields.colorQty
  }) };
}
