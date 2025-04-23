// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/forms/builders/itemFormBuilder.js
// @version: 2.1

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
 * Builds the item form layout and returns the form element and its fields.
 * Includes a subheading and a container for top-aligned buttons.
 */
export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  // Top section with subheading and placeholder for floating buttons
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add Item";

  subheadingWrap.appendChild(subheading);
  form.appendChild(subheadingWrap);

  // Generate form field rows
  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("def-name");
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField("def-type");
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("def-rarity");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("def-description");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });
  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField("def-value");
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField("def-quantity");
  const { rowImgS, fldImgS, rowImgL, fldImgL } = createImageFieldSet();

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
      fldName, fldType, fldRarity, fldDesc, fldValue, fldQty,
      fldImgS, fldImgL,
      colorName, colorType, colorRarity, colorDesc, colorValue, colorQty,
      extraInfo
    },
    subheadingWrap,
    subheading
  };
}
