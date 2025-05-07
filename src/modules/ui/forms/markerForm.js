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
import { createPickr } from "../../ui/pickrManager.js";
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

export function createMarkerForm() {
  const form = document.createElement("form");
  form.id = "marker-form";

  // Unique‐ID fields so they never clash
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
  const { row: rowVid, input: fldVid }   = createVideoField("Video:", "marker-fld-vid");

  // spacing tweaks
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

  // Map button element → Pickr instance
  const pickrs = new Map();
  const pickrTargets = [colorName, colorRarity, colorItemType, colorDesc];

  // Initialize Pickr on any uninitialized target
  function initPickrs() {
    pickrTargets.forEach(el => {
      if (!pickrs.has(el)) {
        const selector = `#${el.id}`;
        const p = createPickr(selector);
        pickrs.set(el, p);
      }
    });
  }

  // Helpers
  const safe = (val, fallback = "") => val ?? fallback;
  const getPickrHexColor = (el, fallback = "#E5E6E8") =>
    pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fallback;

  // Populate form from an item definition
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

    extraInfo.setLines(safe(def.extraLines, []), false);

    // Media
    fldImgS.value = safe(def.imageSmall);
    fldImgL.value = safe(def.imageBig);
    fldVid.value  = safe(def.video);
  }

  // Populate form for non-item data (teleports, etc.)
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

  // Harvest form values
  function getCustom() {
    return {
      name:            fldName.value.trim(),
      nameColor:       getPickrHexColor(colorName),
      rarity:          fldRarity.value,
      rarityColor:     getPickrHexColor(colorRarity),
      itemType:        fldItemType.value,
      itemTypeColor:   getPickrHexColor(colorItemType),
      description:     fldDesc.value.trim(),
      descriptionColor:getPickrHexColor(colorDesc),
      extraLines:      extraInfo.getLines(),
      imageSmall:      fldImgS.value.trim(),
      imageBig:        fldImgL.value.trim(),
      video:           fldVid.value.trim()
    };
  }

  return {
    form,
    fields: {
      fldName,   colorName,
      fldRarity, colorRarity,
      fldItemType, colorItemType,
      fldDesc,   colorDesc,
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
