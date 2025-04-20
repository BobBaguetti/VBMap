// @version: 4
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
  
  import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
  import { createPickr } from "../../ui/pickrManager.js";
  
  export function createMarkerForm() {
    const form = document.createElement("form");
    form.id = "marker-form";
  
    const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("fld-name");
    const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("fld-rarity");
    const { row: rowItemType, select: fldItemType, colorBtn: colorItemType } = createItemTypeField("fld-item-type");
    const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("fld-desc-item");
    const { extraInfo } = createExtraInfoField();
    const extraRow = createTopAlignedFieldRow("Extra Info:", extraInfo.block);
    const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
    const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
    const { row: rowVid, input: fldVid } = createVideoField("Video:", "fld-vid");
  
    form.append(
      rowName,
      rowRarity,
      rowItemType,
      rowDesc,
      extraRow,
      rowImgS,
      rowImgL,
      rowVid
    );
  
    // Initialize Pickr color pickers
    setTimeout(() => {
      [colorName, colorRarity, colorItemType, colorDesc].forEach(btn => {
        createPickr(`#${btn.id}`);
      });
    }, 0);
  
    function setFromDefinition(def) {
        def = def || {}; // restore safety fallback
      
        fldName.value = def.name || "";
        fldName.style.color = def.nameColor || "#E5E6E8";
      
        fldRarity.value = def.rarity || "";
        fldRarity.style.color = def.rarityColor || "#E5E6E8";
      
        fldItemType.value = def.itemType || "";
        fldItemType.style.color = def.itemTypeColor || "#E5E6E8";
      
        fldDesc.value = def.description || "";
        fldDesc.style.color = def.descriptionColor || "#E5E6E8";
      
        extraInfo.setLines(def.extraLines || [], true);
      
        fldImgS.value = def.imageSmall || "";
        fldImgL.value = def.imageBig || "";
        fldVid.value = def.video || "";
      }
      
  
    function setFromNonItem(data = {}) {
      fldName.value = data.name || "";
      fldName.style.color = data.nameColor || "#E5E6E8";
  
      fldDesc.value = data.description || "";
      fldDesc.style.color = data.descriptionColor || "#E5E6E8";
  
      extraInfo.setLines(data.extraLines || [], false);
  
      fldImgS.value = data.imageSmall || "";
      fldImgL.value = data.imageBig || "";
      fldVid.value = data.video || "";
    }
  
    function getCustom() {
      return {
        name: fldName.value.trim(),
        nameColor: getColor(fldName),
        rarity: fldRarity.value,
        rarityColor: getColor(fldRarity),
        itemType: fldItemType.value,
        itemTypeColor: getColor(fldItemType),
        description: fldDesc.value.trim(),
        descriptionColor: getColor(fldDesc),
        extraLines: extraInfo.getLines(),
        imageSmall: fldImgS.value.trim(),
        imageBig: fldImgL.value.trim(),
        video: fldVid.value.trim()
      };
    }
  
    function getNonItem() {
      return {
        name: fldName.value.trim(),
        nameColor: getColor(fldName),
        description: fldDesc.value.trim(),
        descriptionColor: getColor(fldDesc),
        extraLines: extraInfo.getLines(),
        imageSmall: fldImgS.value.trim(),
        imageBig: fldImgL.value.trim(),
        video: fldVid.value.trim()
      };
    }
  
    function getColor(el) {
      return el.style.color || "#E5E6E8";
    }
  
    return {
      form,
      fields: {
        fldName, colorName,
        fldRarity, colorRarity,
        fldItemType, colorItemType,
        fldDesc, colorDesc,
        extraInfo,
        extraRow,
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
  