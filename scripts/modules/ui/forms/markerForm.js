// @file: /scripts/modules/ui/forms/markerForm.js
// @version: 11.4 – fixed imports to match current fieldBuilders & universalForm

import {
  createTextField,
  createDropdownField,
  createTextAreaField,
  createImageField
} from "../components/fieldBuilders.js";

import {
  createExtraInfoField
} from "./universalForm.js";

import { createPickr } from "../components/pickrUtils.js";
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

export function createMarkerForm() {
  const form = document.createElement("form");
  form.id = "marker-form";

  // Build fields
  const { row: rowName, input: fldName } =
    createTextField("marker-fld-name", "Name:");
  const colorName = document.createElement("span"); // placeholder for pickr
  rowName.appendChild(colorName);

  const { row: rowRarity, select: fldRarity } =
    createDropdownField("marker-fld-rarity", "Rarity:", [
      { value: "",          label: "Select Rarity" },
      { value: "common",    label: "Common" },
      { value: "uncommon",  label: "Uncommon" },
      { value: "rare",      label: "Rare" },
      { value: "epic",      label: "Epic" },
      { value: "legendary", label: "Legendary" }
    ]);
  const colorRarity = document.createElement("span");
  rowRarity.appendChild(colorRarity);

  const { row: rowItemType, select: fldItemType } =
    createDropdownField("marker-fld-item-type", "Item Type:", [
      { value: "",                   label: "Select Type" },
      { value: "Crafting Material",  label: "Crafting Material" },
      { value: "Special",            label: "Special" },
      { value: "Consumable",         label: "Consumable" },
      { value: "Quest",              label: "Quest" }
    ]);
  const colorItemType = document.createElement("span");
  rowItemType.appendChild(colorItemType);

  const { row: rowDesc, textarea: fldDesc } =
    createTextAreaField("marker-fld-desc-item", "Description:");
  const colorDesc = document.createElement("span");
  rowDesc.appendChild(colorDesc);

  const { row: rowExtra, extraInfo } =
    createExtraInfoField({ withDividers: true });

  const { row: rowImgS, input: fldImgS } =
    createImageField("marker-fld-img-s", "Image S:");
  const { row: rowImgL, input: fldImgL } =
    createImageField("marker-fld-img-l", "Image L:");
  // Video URL as plain text field
  const { row: rowVid, input: fldVid } =
    createTextField("marker-fld-vid", "Video URL:", "url");

  // Spacing tweaks
  rowRarity.classList.add("item-gap");
  rowItemType.classList.add("item-gap");
  rowDesc.classList.add("item-gap");

  // Assemble form
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

  // Pickr setup
  const pickrs = new Map();
  const targets = [colorName, colorRarity, colorItemType, colorDesc];

  function initPickrs() {
    targets.forEach(el => {
      if (!pickrs.has(el)) {
        el.id = el.id || `pickr-${Math.random().toString(36).slice(2,8)}`;
        pickrs.set(el, createPickr(`#${el.id}`));
      }
    });
  }

  const safe = (v, f = "") => v ?? f;
  const getColor = (el, fallback) =>
    pickrs.get(el)?.getColor()?.toHEXA()?.toString() || fallback;

  function setFromDefinition(def = {}) {
    initPickrs();

    fldName.value = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");

    fldRarity.value = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(
      def.rarityColor || rarityColors[fldRarity.value] || "#E5E6E8"
    );

    fldItemType.value = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(
      def.itemTypeColor ||
      itemTypeColors[fldItemType.value] ||
      "#E5E6E8"
    );

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
      nameColor:        getColor(colorName, "#E5E6E8"),
      rarity:           fldRarity.value,
      rarityColor:      getColor(colorRarity, "#E5E6E8"),
      itemType:         fldItemType.value,
      itemTypeColor:    getColor(colorItemType, "#E5E6E8"),
      description:      fldDesc.value.trim(),
      descriptionColor: getColor(colorDesc, "#E5E6E8"),
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
