// @version: 5.1
// @file: /src/modules/ui/forms/builders/itemFormBuilder.js

import {
  createNameField,
  createItemTypeField,
  createRarityField,
  createDescriptionField,
  createValueField,
  createQuantityField,
  createImageFieldSet
} from "../../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../../components/uiKit/extraInfoBlock.js";

export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-form";

  // Name
  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField();
  colorName.id = "fld-name-color";
  colorName.classList.add("color-swatch");

  // Item Type
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField();
  // insert placeholder
  const placeholderType = document.createElement("option");
  placeholderType.value = "";
  placeholderType.disabled = true;
  placeholderType.selected = true;
  placeholderType.textContent = "Select Item Type";
  fldType.insertBefore(placeholderType, fldType.firstChild);
  colorType.id = "fld-item-type-color";
  colorType.classList.add("color-swatch");

  // Rarity
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField();
  const placeholderRarity = document.createElement("option");
  placeholderRarity.value = "";
  placeholderRarity.disabled = true;
  placeholderRarity.selected = true;
  placeholderRarity.textContent = "Select Rarity";
  fldRarity.insertBefore(placeholderRarity, fldRarity.firstChild);
  colorRarity.id = "fld-rarity-color";
  colorRarity.classList.add("color-swatch");

  // Description
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField();
  colorDesc.id = "fld-desc-item-color";
  colorDesc.classList.add("color-swatch");

  // Extra Info (no color swatch here)
  const extraInfo = createExtraInfoBlock({ withDividers: true });
  const rowExtras = createFieldRow("Extra Info", extraInfo.block);

  // Value
  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField();
  colorValue.id = "fld-value-color";
  colorValue.classList.add("color-swatch");

  // Quantity
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField();
  colorQty.id = "fld-quantity-color";
  colorQty.classList.add("color-swatch");

  // Images
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
