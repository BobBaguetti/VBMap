// @version: 1
// @file: /scripts/modules/forms/itemFormBuilder.js

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
  
  export function createItemFormLayout() {
    const form = document.createElement("form");
    form.id = "item-form";
  
    const { row: rowName, input: fldName, colorBtn: colorName } = createNameField();
    const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField();
    const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField();
    const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField();
    const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField();
    const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField();
    const { row: rowExtras, extraInfo } = createExtraInfoField();
    const {
      rowImgS, fldImgS,
      rowImgL, fldImgL,
      rowVid, fldVid
    } = createImageFieldSet();
  
    form.append(
      rowName,
      rowType,
      rowRarity,
      rowDesc,
      rowValue,
      rowQty,
      rowExtras,
      rowImgS,
      rowImgL,
      rowVid
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
        fldImgS, fldImgL, fldVid,
        extraInfo
      }
    };
  }
  