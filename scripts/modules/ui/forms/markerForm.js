// @version: 9
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
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

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

  [ rowRarity, rowItemType, rowDesc ].forEach(r => r.classList.add("item-gap"));

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

  function initPickrs() {
    pickrTargets.forEach(el => {
      if (pickrs.has(el)) {
        // already initialized
        return;
      }
      const p = createPickr(`#${el.id}`);
      pickrs.set(el, p);
    });
  }

  function safe(val, fallback = "") {
    return val ?? fallback;
  }

  function getPickrHexColor(el, fallback = "#E5E6E8") {
    return pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fallback;
  }

  function setFromDefinition(def = {}) {
    initPickrs();
    // Name
    fldName.value = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");

    // Rarity
    fldRarity.value = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(
      rarityColors[fldRarity.value] || def.rarityColor || "#E5E6E8"
    );

    // Item Type
    fldItemType.value = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(
      itemTypeColors[fldItemType.value] || def.itemTypeColor || "#E5E6E8"
    );

    // Description
    fldDesc.value = safe(def.description);
    pickrs.get(colorDesc)?.setColor(def.descriptionColor || "#E5E6E8");

    // Extra info
    extraInfo.setLines(safe(def.extraLines, []), false);

    // Media fields
    fldImgS.value = safe(def.imageSmall);
    fldImgL.value = safe(def.imageBig);
    fldVid.value = safe(def.video);
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

  // initialize once
  initPickrs();

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
    initPickrs,
    setFromDefinition,
    setFromNonItem,
    getCustom,
    getNonItem
  };
}
