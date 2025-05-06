// @version: 3.1
// @file: /scripts/modules/ui/forms/universalForm.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createExtraInfoBlock
} from "../components/fieldBuilders.js";

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";

export function createNameField(id = "fld-name") {
  return createTextField("Name:", id);
}

export function createTypeField(id = "fld-type") {
  return createDropdownField(
    "Type:",
    id,
    [
      { value: "Door", label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item", label: "Item" },
      { value: "Teleport", label: "Teleport" },
      { value: "Spawn Point", label: "Spawn Point" }
    ],
    { showColor: false }
  );
}

export function createItemTypeField(id = "fld-item-type") {
  return createDropdownField("Item Type:", id, [
    { value: "Crafting Material", label: "Crafting Material" },
    { value: "Special",           label: "Special" },
    { value: "Consumable",        label: "Consumable" },
    { value: "Quest",             label: "Quest" }
  ]);
}

export function createDescriptionField(id = "fld-desc-item") {
  return createTextareaFieldWithColor("Description:", id);
}

export function createExtraInfoField({ withDividers = false } = {}) {
  const extra = createExtraInfoBlock();
  const row = createTopAlignedFieldRow("Extra Info:", extra.block);

  if (!withDividers) {
    return { row, extraInfo: extra };
  }

  const container = document.createElement("div");
  const hrAbove   = document.createElement("hr");
  const hrBelow   = document.createElement("hr");
  container.append(hrAbove, row, hrBelow);

  return { row: container, extraInfo: extra };
}

export function createImageFieldSet() {
  const imgS = createImageField("Image S:", "fld-img-s");
  const imgL = createImageField("Image L:", "fld-img-l");
  const vid  = createVideoField("Video:",   "fld-vid");
  return {
    rowImgS: imgS.row, fldImgS: imgS.input,
    rowImgL: imgL.row, fldImgL: imgL.input,
    rowVid:  vid.row,  fldVid:  vid.input
  };
}

export function createValueField(id = "fld-value") {
  return createTextField("Value:", id);
}

export function createQuantityField(id = "fld-quantity") {
  return createTextField("Quantity:", id);
}

export function createRarityField(id = "fld-rarity") {
  return createDropdownField("Rarity:", id, [
    { value: "",           label: "Select Rarity" },
    { value: "common",     label: "Common" },
    { value: "uncommon",   label: "Uncommon" },
    { value: "rare",       label: "Rare" },
    { value: "epic",       label: "Epic" },
    { value: "legendary",  label: "Legendary" }
  ]);
}
