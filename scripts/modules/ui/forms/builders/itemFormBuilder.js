// @file: /scripts/modules/ui/forms/builders/itemFormBuilder.js
// @version: 3.1 – fixed imports for createTextField/createDropdownField

import {
  createTextField,
  createDropdownField
} from "../../ui/uiKit.js";

import {
  createDescriptionField,
  createExtraInfoField
} from "../universalForm.js";

/**
 * Build the item form.
 *
 * @param {string} [idPrefix="item"]
 * @returns {{ form: HTMLFormElement, fields: Object }}
 */
export function createItemForm(idPrefix = "item") {
  const form = document.createElement("form");
  form.id = `${idPrefix}-form`;

  // Name
  const { row: rowName, input: fldName } =
    createTextField("Name:", `fld-${idPrefix}-name`);

  // Item Type
  const typeOpts = [
    { value: "", label: "" },
    { value: "Crafting Material", label: "Crafting Material" },
    { value: "Special", label: "Special" },
    { value: "Consumable", label: "Consumable" },
    { value: "Quest", label: "Quest" }
  ];
  const { row: rowType, select: fldType, colorBtn: colorType } =
    createDropdownField("Item Type:", `fld-${idPrefix}-type`, typeOpts);

  // Rarity
  const rarityOpts = [
    { value: "", label: "" },
    { value: "Common", label: "Common" },
    { value: "Uncommon", label: "Uncommon" },
    { value: "Rare", label: "Rare" }
  ];
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } =
    createDropdownField("Rarity:", `fld-${idPrefix}-rarity`, rarityOpts);

  // Description + color swatch
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createDescriptionField(`fld-${idPrefix}-description`);

  // Extra Info rows
  const { row: rowExtras, extraInfo } =
    createExtraInfoField({ withDividers: true });

  // Value
  const { row: rowValue, input: fldValue, colorBtn: colorValue } =
    createTextField("Value:", `fld-${idPrefix}-value`);

  // Quantity
  const { row: rowQty, input: fldQty, colorBtn: colorQty } =
    createTextField("Quantity:", `fld-${idPrefix}-quantity`);

  // Assemble form fields
  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    rowExtras,
    rowValue,
    rowQty
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
      colorType,
      colorRarity,
      colorDesc,
      colorValue,
      colorQty
    }
  };
}
