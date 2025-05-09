// @version: 12
// @file: /src/modules/ui/forms/markerForm.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createFieldRow
} from "../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../components/uiKit/extraInfoBlock.js";
import { createPickr }         from "../../ui/pickrManager.js";
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";

export function createMarkerForm() {
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
      { value: "",        label: "Select Rarity" },
      { value: "common",  label: "Common" },
      { value: "uncommon",label: "Uncommon" },
      { value: "rare",    label: "Rare" },
      { value: "epic",    label: "Epic" },
      { value: "legendary",label:"Legendary" }
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
  const { row: rowVid, input: fldVid }   = createVideoField("Video:",  "marker-fld-vid");

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

  // — Pickr wiring —
  const pickrs = new Map();
  const pickrTargets = [colorName, colorRarity, colorItemType, colorDesc];
  function initPickrs() {
    pickrTargets.forEach(el => {
      if (!pickrs.has(el)) {
        const p = createPickr(`#${el.id}`);
        pickrs.set(el, p);
      }
    });
  }

  // — Helpers —
  const safe = (v, f = "") => v ?? f;
  const getPickrHexColor = (el, f = "#E5E6E8") =>
    pickrs.get(el)?.getColor()?.toHEXA()?.toString() || f;

  // — Populate from defs —
  function setFromDefinition(def = {}) {
    initPickrs();
    fldName.value = safe(def.name);
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");
    fldRarity.value = safe(def.rarity);
    pickrs.get(colorRarity)?.setColor(
      rarityColors[fldRarity.value] || def.rarityColor || "#E5E6E8"
    );
    fldItemType.value = safe(def.itemType);
    pickrs.get(colorItemType)?.setColor(
      itemTypeColors[fldItemType.value] || def.itemTypeColor || "#E5E6E8"
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

  // — Read back values —
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
      extraRow:  rowExtra,
      fldImgS, fldImgL, fldVid
    },
    initPickrs,
    setFromDefinition,
    setFromNonItem,
    getCustom
  };
}
