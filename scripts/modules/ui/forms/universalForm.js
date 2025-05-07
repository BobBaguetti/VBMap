// @version: 3.2
// @file: /scripts/modules/ui/forms/universalForm.js

import {
  createTextField,
  createDropdownField,
  createTextAreaField,
  createImageField
} from "../components/fieldBuilders.js";
import { createTopAlignedFieldRow } from "../../utils/formUtils.js";

/**
 * Name field.
 */
export function createNameField() {
  const { row, input } = createTextField("name", "Name:");
  return { row, input };
}

/**
 * Type field (map markers).
 */
export function createTypeField() {
  const opts = [
    { value: "Door", label: "Door" },
    { value: "Extraction Portal", label: "Extraction Portal" },
    { value: "Item", label: "Item" },
    { value: "Teleport", label: "Teleport" },
    { value: "Spawn Point", label: "Spawn Point" },
    { value: "Chest", label: "Chest" }
  ];
  const { row, select } = createDropdownField("type", "Type:", opts);
  return { row, select };
}

/**
 * Description field.
 */
export function createDescriptionField() {
  const { row, textarea } = createTextAreaField("description", "Description:");
  return { row, textarea };
}

/**
 * Extra Info section.
 * (This is a simple block you can append rows into.)
 */
export function createExtraInfoField({ withDividers = false } = {}) {
  const block = document.createElement("div");
  block.className = "extra-info-block";
  const row = createTopAlignedFieldRow("Extra Info:", block);

  if (!withDividers) {
    return { row, extraInfo: { block } };
  }
  const container = document.createElement("div");
  const hr1 = document.createElement("hr");
  const hr2 = document.createElement("hr");
  container.append(hr1, row, hr2);
  return { row: container, extraInfo: { block } };
}

/**
 * Image & Video fields.
 */
export function createImageFieldSet() {
  const { row: rowImgS, input: fldImgS } = createImageField("imageSmall", "Image (small):");
  const { row: rowImgL, input: fldImgL } = createImageField("imageLarge", "Image (large):");

  // simple URL field for video
  const { row: rowVid, input: fldVid } = createTextField("videoUrl", "Video URL:", "url");

  return { rowImgS, fldImgS, rowImgL, fldImgL, rowVid, fldVid };
}

/**
 * Value field.
 */
export function createValueField() {
  const { row, input } = createTextField("value", "Value:");
  return { row, input };
}

/**
 * Quantity field.
 */
export function createQuantityField() {
  const { row, input } = createTextField("quantity", "Quantity:");
  return { row, input };
}

/**
 * Rarity field.
 */
export function createRarityField() {
  const opts = [
    { value: "", label: "Select Rarity" },
    { value: "common", label: "Common" },
    { value: "uncommon", label: "Uncommon" },
    { value: "rare", label: "Rare" },
    { value: "epic", label: "Epic" },
    { value: "legendary", label: "Legendary" }
  ];
  const { row, select } = createDropdownField("rarity", "Rarity:", opts);
  return { row, select };
}
