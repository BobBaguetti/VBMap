// @version: 4
// @file: /scripts/modules/forms/builders/itemFormBuilder.js

import {
  createNameField,
  createItemTypeField,
  createRarityField,
  createDescriptionField,
  createValueField,
  createQuantityField,
  createImageFieldSet,
  createExtraInfoField
} from "../universalForm.js";

export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-form";

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField();
  colorName.id = "fld-name-color";

  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField();
  colorType.id = "fld-item-type-color";

  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField();
  colorRarity.id = "fld-rarity-color";

  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField();
  colorDesc.id = "fld-desc-item-color";

  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField();
  colorValue.id = "fld-value-color";

  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField();
  colorQty.id = "fld-quantity-color";

  const {
    rowImgS, fldImgS,
    rowImgL, fldImgL
  } = createImageFieldSet();

  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    rowExtras,
    rowValue,
    rowQty,
    rowImgS,
    rowImgL
  );

  return {
    form,
    fields: {
      fldName, colorName,
      fldType, colorType,
      fldRarity, colorRarity,
      fldDesc, colorDesc,
      fldValue, colorValue,
      fldQty, colorQty,
      fldImgS, fldImgL,
      extraInfo,
      rowExtras,
      rowValue,
      rowQty
    }
  };
}
