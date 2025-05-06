// @file: /scripts/modules/ui/forms/markerForm.js
// @version: 11.1 – fully wired to fieldBuilders.js and pickrMixin

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
} from "../components/fieldBuilders.js";

import { createPickr } from "../components/pickrMixin.js";
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

export function createMarkerForm() {
  const form = document.createElement("form");
  form.id = "marker-form";

  const { row: rowName, input: fldName, colorBtn: colorName } =
    createNameField("marker-fld-name");
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } =
    createRarityField("marker-fld-rarity");
  const { row: rowItemType, select: fldItemType, colorBtn: colorItemType } =
    createItemTypeField("marker-fld-item-type");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createDescriptionField("marker-fld-desc-item");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "marker-fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "marker-fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:",   "marker-fld-vid");

  // spacing
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

  // Pickr map
  const pickrs = new Map();
  const pickrTargets = [colorName, colorRarity, colorItemType, colorDesc];

  function initPickrs() {
    pickrTargets.forEach(el => {
      if (!pickrs.has(el)) {
        pickrs.set(el, createPickr(`#${el.id}`));
      }
    });
  }

  const safe = (v, d="") => v ?? d;
  const getColor = (el, fallback="#E5E6E8") =>
    pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fallback;

  function setFromDefinition(def = {}) {
    initPickrs();
    fldName.value = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");
    fldRarity.value = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(def.rarityColor || rarityColors[fldRarity.value] || "#E5E6E8");
    fldItemType.value = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(def.itemTypeColor || itemTypeColors[fldItemType.value] || "#E5E6E8");
    fldDesc.value = safe(def.description);
    pickrs.get(colorDesc)?.setColor(def.descriptionColor || "#E5E6E8");
    extraInfo.setLines(safe(def.extraLines, []), false);
    fldImgS.value = safe(def.imageSmall);
    fldImgL.value = safe(def.imageBig);
    fldVid.value  = safe(def.video);
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
      name:             fldName.value.trim(),
      nameColor:        getColor(colorName),
      rarity:           fldRarity.value,
      rarityColor:      getColor(colorRarity),
      itemType:         fldItemType.value,
      itemTypeColor:    getColor(colorItemType),
      description:      fldDesc.value.trim(),
      descriptionColor: getColor(colorDesc),
      extraLines:       extraInfo.getLines(),
      imageSmall:       fldImgS.value.trim(),
      imageBig:         fldImgL.value.trim(),
      video:            fldVid.value.trim()
    };
  }

  return {
    form,
    fields: {
      fldName, colorName,
      fldRarity, colorRarity,
      fldItemType, colorItemType,
      fldDesc, colorDesc,
      extraInfo, extraRow: rowExtra,
      fldImgS, fldImgL, fldVid
    },
    initPickrs,
    setFromDefinition,
    setFromNonItem,
    getCustom
  };
}
