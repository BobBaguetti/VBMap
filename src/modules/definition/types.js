// @version: 7.1
// @file: /src/modules/ui/forms/builders/itemFormBuilder.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField
} from "../../components/uiKit/fieldKit.js";

export function createItemForm() {
  const form = document.createElement("form");
  form.id = "item-form";

  // — Name —
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name", "fld-name");
  colorName.classList.add("color-swatch");

  // — Item Type —
  const { row: rowType, select: fldType, colorBtn: colorType } =
    createDropdownField(
      "Item Type",
      "fld-item-type",
      [
        { value: "",                   label: "Select Item Type" },
        { value: "Crafting Material",  label: "Crafting Material" },
        { value: "Special",            label: "Special" },
        { value: "Consumable",         label: "Consumable" },
        { value: "Quest",              label: "Quest" }
      ]
    );
  colorType.classList.add("color-swatch");

  // — Rarity —
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } =
    createDropdownField(
      "Rarity",
      "fld-rarity",
      [
        { value: "",         label: "Select Rarity" },
        { value: "common",   label: "Common" },
        { value: "uncommon", label: "Uncommon" },
        { value: "rare",     label: "Rare" },
        { value: "epic",     label: "Epic" },
        { value: "legendary",label: "Legendary" }
      ]
    );
  colorRarity.classList.add("color-swatch");

  // — Description —
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description", "fld-desc-item");
  colorDesc.classList.add("color-swatch");

  // — Extra Info (with HR dividers & top alignment) —
  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  // — Value —
  const { row: rowValue, input: fldValue, colorBtn: colorValue } =
    createTextField("Value", "fld-value");
  fldValue.type = "number";
  colorValue.classList.add("color-swatch");

  // — Quantity —
  const { row: rowQty, input: fldQty, colorBtn: colorQty } =
    createTextField("Quantity", "fld-quantity");
  fldQty.type = "number";
  colorQty.classList.add("color-swatch");

  // — Images —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S", "fld-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L", "fld-img-l");

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
      fldName,   colorName,
      fldType,   colorType,
      fldRarity, colorRarity,
      fldDesc,   colorDesc,
      extraInfo,
      fldValue,  colorValue, rowValue,
      fldQty,    colorQty,   rowQty,
      fldImgS,   fldImgL
    }
  };
}
