// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/forms/builders/itemFormBuilder.js
// @version: 1.2

import {
  createNameField,
  createItemTypeField,
  createRarityField,
  createDescriptionField,
  createExtraInfoField,
  createValueField,
  createQuantityField,
  createImageFieldSet
} from "../universalForm.js";




/**
 * Creates the item definition form layout with all labeled fields.
 */
export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add Item";
  subheadingWrap.appendChild(subheading);

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("fld-name");
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField("fld-item-type");
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("fld-rarity");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("fld-desc-item");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });
  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField("fld-value");
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField("fld-quantity");
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");

  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    rowExtra,
    rowValue,
    rowQty,
    rowImgS,
    rowImgL
  );

  return {
    form,
    fields: {
      fldName,
      fldType,
      fldRarity,
      fldDesc,
      extraInfo,
      fldValue,
      fldQty,
      fldImgS,
      fldImgL,
      colorName,
      colorType,
      colorRarity,
      colorDesc,
      colorValue,
      colorQty
    },
    subheadingWrap,
    subheading
  };
}
