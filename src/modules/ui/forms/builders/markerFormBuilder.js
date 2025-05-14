// @file: src/modules/ui/forms/builders/markerFormBuilder.js
// @version: 1.0 — DOM builder for marker form (fields only)

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createFieldRow
} from "../../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../../components/uiKit/extraInfoBlock.js";

/**
 * Builds the marker form DOM and exposes its fields.
 *
 * @returns {{
 *   form: HTMLFormElement,
 *   fields: {
 *     fldName: HTMLInputElement,
 *     colorName: HTMLElement,
 *     fldRarity: HTMLSelectElement,
 *     colorRarity: HTMLElement,
 *     fldItemType: HTMLSelectElement,
 *     colorItemType: HTMLElement,
 *     fldDesc: HTMLTextAreaElement,
 *     colorDesc: HTMLElement,
 *     extraInfo: object,
 *     extraRow: HTMLElement,
 *     fldImgS: HTMLInputElement,
 *     fldImgL: HTMLInputElement,
 *     fldVid: HTMLInputElement
 *   }
 * }}
 */
export function createMarkerFormBuilder() {
  const form = document.createElement("form");
  form.id = "marker-form";

  // — Name —
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name:", "marker-fld-name");
  colorName.id = "marker-fld-name-color";
  colorName.classList.add("color-swatch");

  // — Rarity —
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } =
    createDropdownField("Rarity:", "marker-fld-rarity", [
      { value: "",         label: "Select Rarity" },
      { value: "common",   label: "Common" },
      { value: "uncommon", label: "Uncommon" },
      { value: "rare",     label: "Rare" },
      { value: "epic",     label: "Epic" },
      { value: "legendary",label: "Legendary" }
    ]);
  colorRarity.id = "marker-fld-rarity-color";
  colorRarity.classList.add("color-swatch");

  // — Item Type —
  const { row: rowItemType, select: fldItemType, colorBtn: colorItemType } =
    createDropdownField("Item Type:", "marker-fld-item-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special" },
      { value: "Consumable",        label: "Consumable" },
      { value: "Quest",             label: "Quest" }
    ]);
  colorItemType.id = "marker-fld-item-type-color";
  colorItemType.classList.add("color-swatch");

  // — Description —
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description:", "marker-fld-desc");
  colorDesc.id = "marker-fld-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info —
  const extraInfo = createExtraInfoBlock({ withDividers: true });
  const rowExtra  = createFieldRow("Extra Info:", extraInfo.block);

  // — Media —
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "marker-fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "marker-fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:", "marker-fld-vid");

  // spacing tweaks
  rowRarity.classList.add("item-gap");
  rowItemType.classList.add("item-gap");
  rowDesc.classList.add("item-gap");

  // assemble form
  form.append(
    rowName,
    rowRarity,
    rowItemType,
    rowDesc,
    rowExtra,
    rowImgS,
    rowImgL,
    rowVid
  );

  return {
    form,
    fields: {
      fldName,   colorName,
      fldRarity, colorRarity,
      fldItemType, colorItemType,
      fldDesc,   colorDesc,
      extraInfo, extraRow: rowExtra,
      fldImgS,   fldImgL, fldVid
    }
  };
}
