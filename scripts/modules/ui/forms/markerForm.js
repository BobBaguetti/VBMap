// @version: 7
// @file: /scripts/modules/ui/forms/markerForm.js

import {
  createNameField,
  createRarityField,
  createItemTypeField,
  createDescriptionField,
  createExtraInfoField
} from "./universalForm.js";

import {
  createImageField,
  createVideoField
} from "../../ui/uiKit.js";

import { createPickr } from "../../ui/pickrManager.js";

export function createMarkerForm() {
  const form = document.createElement("form");
  form.id = "marker-form";

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("fld-name");
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("fld-rarity");
  const { row: rowItemType, select: fldItemType, colorBtn: colorItemType } = createItemTypeField("fld-item-type");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("fld-desc-item");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
  const { row: rowVid, input: fldVid } = createVideoField("Video:", "fld-vid");

  rowRarity.classList.add("item-gap");
  rowItemType.classList.add("item-gap");
  rowDesc.classList.add("item-gap");

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

  const pickrs = new Map();
  const pickrTargets = [colorName, colorRarity, colorItemType, colorDesc];

  setTimeout(() => {
    pickrTargets.forEach(el => {
      const p = createPickr(`#${el.id}`);
      pickrs.set(el, p);
    });
  }, 0);

  function safe(val, fallback = "") {
    return val ?? fallback;
  }

  function getPickrHexColor(el, fallback = "#E5E6E8") {
    return pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fallback;
  }

  function setFromDefinition(def = {}) {
    fldName.value = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");

    fldRarity.value = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(def.rarityColor || "#E5E6E8");

    fldItemType.value = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(def.itemTypeColor || "#E5E6E8");

    fldDesc.value = safe(def.description);
    pickrs.get(colorDesc)?.setColor(def.descriptionColor || "#E5E6E8");

    extraInfo.setLines(safe(def.extraLines, []), false);
    fldImgS.value = safe(def.imageSmall);
    fldImgL.value = safe(def.imageBig);
    fldVid.value = safe(def.video);
  }

  function setFromNonItem(data = {}) {
    fldName.value = safe(data.name);
    pickrs.get(colorName)?.setColor(data.nameColor || "#E5E6E8");

    fldDesc.value = safe(data.description);
    pickrs.get(colorDesc)?.setColor(data.descriptionColor || "#E5E6E8");

    extraInfo.setLines(safe(data.extraLines, []), false);
    fldImgS.value = safe(data.imageSmall);
    fldImgL.value = safe(data.imageBig);
    fldVid.value = safe(data.video);
  }

  function getCustom() {
    return {
      name: fldName.value.trim(),
      nameColor: getPickrHexColor(colorName),
      rarity: fldRarity.value,
      rarityColor: getPickrHexColor(colorRarity),
      itemType: fldItemType.value,
      itemTypeColor: getPickrHexColor(colorItemType),
      description: fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(colorDesc),
      extraLines: extraInfo.getLines(),
      imageSmall: fldImgS.value.trim(),
      imageBig: fldImgL.value.trim(),
      video: fldVid.value.trim()
    };
  }

  function getNonItem() {
    return {
      name: fldName.value.trim(),
      nameColor: getPickrHexColor(colorName),
      description: fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(colorDesc),
      extraLines: extraInfo.getLines(),
      imageSmall: fldImgS.value.trim(),
      imageBig: fldImgL.value.trim(),
      video: fldVid.value.trim()
    };
  }

  return {
    form,
    fields: {
      fldName, colorName,
      fldRarity, colorRarity,
      fldItemType, colorItemType,
      fldDesc, colorDesc,
      extraInfo,
      extraRow: rowExtra,
      fldImgS,
      fldImgL,
      fldVid
    },
    setFromDefinition,
    setFromNonItem,
    getCustom,
    getNonItem
  };
}
