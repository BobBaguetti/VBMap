// @version: 2
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
} from "./universalForm.js";

export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-form";

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField();
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField();
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField();
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField();
  const { row: rowExtras, extraInfo } = createExtraInfoField();
  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField();
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField();
  const {
    rowImgS, fldImgS,
    rowImgL, fldImgL
  } = createImageFieldSet();

  // Insert <hr> elements
  const hrAboveExtras = document.createElement("hr");
  const hrBelowExtras = document.createElement("hr");

  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    hrAboveExtras,
    rowExtras,
    hrBelowExtras,
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
      extraInfo
    }
  };
}
