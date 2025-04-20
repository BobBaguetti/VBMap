import {
    createNameField,
    createRarityField,
    createItemTypeField,
    createDescriptionField,
    createExtraInfoField,
    createImageField,
  } from "./universalForm.js";
  
  export function createMarkerForm() {
    const form = document.createElement("form");
    form.id = "marker-form";
  
    const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("fld-name");
    const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("fld-rarity");
    const { row: rowItemType, select: fldItemType, colorBtn: colorItemType } = createItemTypeField("fld-item-type");
    const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("fld-desc-item");
    const { row: rowExtra, extraInfo } = createExtraInfoField();
    const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
    const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
    const { row: rowVid, input: fldVid } = createVideoField("Video:", "fld-vid");
  
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
        fldName, colorName,
        fldRarity, colorRarity,
        fldItemType, colorItemType,
        fldDesc, colorDesc,
        extraInfo,
        fldImgS,
        fldImgL,
        fldVid
      }
    };
  }
  