// @version: 11
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

// ← fixed path: from forms folder up to ui then pickrManager.js
import { createPickr }      from "../pickrManager.js"; 
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

export function createMarkerForm() {
  const form = document.createElement("form");
  form.id = "marker-form";

  const {
    row:   rowName,
    input: fldName,
    colorBtn: colorName
  } = createNameField("marker-fld-name");
  colorName.classList.add("color-swatch");

  const {
    row:    rowRarity,
    select: fldRarity,
    colorBtn: colorRarity
  } = createRarityField("marker-fld-rarity");
  colorRarity.classList.add("color-swatch");

  const {
    row:        rowItemType,
    select:     fldItemType,
    colorBtn:   colorItemType
  } = createItemTypeField("marker-fld-item-type");
  colorItemType.classList.add("color-swatch");

  const {
    row:         rowDesc,
    textarea:    fldDesc,
    colorBtn:    colorDesc
  } = createDescriptionField("marker-fld-desc-item");
  colorDesc.classList.add("color-swatch");

  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });

  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "marker-fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "marker-fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:", "marker-fld-vid");

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
  const targets = [colorName, colorRarity, colorItemType, colorDesc];

  function initPickrs() {
    targets.forEach(el => {
      if (!pickrs.has(el)) {
        pickrs.set(el, createPickr(el));
      }
    });
  }

  function safe(val, fallback = "") { return val ?? fallback; }
  function getColor(el, fb = "#E5E6E8") {
    return pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fb;
  }

  function setFromDefinition(def = {}) {
    initPickrs();
    fldName.value      = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");
    fldRarity.value    = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(rarityColors[fldRarity.value] || def.rarityColor || "#E5E6E8");
    fldItemType.value  = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(itemTypeColors[fldItemType.value] || def.itemTypeColor || "#E5E6E8");
    fldDesc.value      = safe(def.description);
    pickrs.get(colorDesc)?.setColor(def.descriptionColor || "#E5E6E8");
    extraInfo.setLines(safe(def.extraLines, []), false);
    fldImgS.value      = safe(def.imageSmall);
    fldImgL.value      = safe(def.imageBig);
    fldVid.value       = safe(def.video);
  }

  function setFromNonItem(data = {}) {
    initPickrs();
    fldName.value = safe(data.name);
    pickrs.get(colorName)?.setColor(data.nameColor || "#E5E6E8");
    fldDesc.value = safe(data.description);
    pickrs.get(colorDesc)?.setColor(data.descriptionColor || "#E5E6E8");
    extraInfo.setLines(safe(data.extraLines, []), false);
    fldImgS.value = safe(data.imageSmall);
    fldImgL.value = safe(data.imageBig);
    fldVid.value  = safe(data.video);
  }

  function getCustom() {
    return {
      name:            fldName.value.trim(),
      nameColor:       getColor(colorName),
      rarity:          fldRarity.value,
      rarityColor:     getColor(colorRarity),
      itemType:        fldItemType.value,
      itemTypeColor:   getColor(colorItemType),
      description:     fldDesc.value.trim(),
      descriptionColor:getColor(colorDesc),
      extraLines:      extraInfo.getLines(),
      imageSmall:      fldImgS.value.trim(),
      imageBig:        fldImgL.value.trim(),
      video:           fldVid.value.trim()
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
      fldImgS, fldImgL, fldVid
    },
    initPickrs,
    setFromDefinition,
    setFromNonItem,
    getCustom
  };
}
