// @version: 5
// @file: /scripts/modules/ui/forms/universalForm.js

import {
  createImageField,
  createVideoField
} from "../../ui/uiKit.js";

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
import {
  makeColorTextField,
  makeColorTextarea,
  makeColorDropdown
} from "./formFieldFactory.js";

import { createExtraInfoFieldBlock } from "./extraInfoField.js";

/**
 * Builds a basic name field with color.
 */
export function createNameField(id = "fld-name") {
  return makeColorTextField("Name:", id);
}

/**
 * Builds a colored dropdown for marker type (used in marker modals).
 */
export function createTypeField(id = "fld-type") {
  return makeColorDropdown("Type:", id, [
    { value: "Door", label: "Door" },
    { value: "Extraction Portal", label: "Extraction Portal" },
    { value: "Item", label: "Item" },
    { value: "Teleport", label: "Teleport" },
    { value: "Spawn Point", label: "Spawn Point" }
  ], { showColor: false });
}

/**
 * Builds a colored dropdown for item type (used in item definition forms).
 */
export function createItemTypeField(id = "fld-item-type") {
  return makeColorDropdown("Item Type:", id, [
    { value: "Crafting Material", label: "Crafting Material" },
    { value: "Special", label: "Special" },
    { value: "Consumable", label: "Consumable" },
    { value: "Quest", label: "Quest" }
  ]);
}

/**
 * Description with color support
 */
export function createDescriptionField(id = "fld-desc-item") {
  return makeColorTextarea("Description:", id);
}

/**
 * Creates extra info section with label + block layout
 */
export function createExtraInfoField({ withDividers = false } = {}) {
  const extra = createExtraInfoFieldBlock();
  const row = createTopAlignedFieldRow("Extra Info:", extra.block);

  if (!withDividers) {
    return { row, extraInfo: extra };
  }

  const container = document.createElement("div");
  const hrAbove = document.createElement("hr");
  const hrBelow = document.createElement("hr");
  container.append(hrAbove, row, hrBelow);

  return { row: container, extraInfo: extra };
}

/**
 * Image + video field bundle
 */
export function createImageFieldSet() {
  const imgS = createImageField("Image S:", "fld-img-s");
  const imgL = createImageField("Image L:", "fld-img-l");
  const vid = createVideoField("Video:", "fld-vid");
  return {
    rowImgS: imgS.row, fldImgS: imgS.input,
    rowImgL: imgL.row, fldImgL: imgL.input,
    rowVid: vid.row, fldVid: vid.input
  };
}

/**
 * Value field with color
 */
export function createValueField(id = "fld-value") {
  return makeColorTextField("Value:", id);
}

/**
 * Quantity field with color
 */
export function createQuantityField(id = "fld-quantity") {
  return makeColorTextField("Quantity:", id);
}

/**
 * Builds a colored dropdown for rarity.
 */
export function createRarityField(id = "fld-rarity") {
  return makeColorDropdown("Rarity:", id, [
    { value: "", label: "Select Rarity" },
    { value: "common", label: "Common" },
    { value: "uncommon", label: "Uncommon" },
    { value: "rare", label: "Rare" },
    { value: "epic", label: "Epic" },
    { value: "legendary", label: "Legendary" }
  ]);
}
