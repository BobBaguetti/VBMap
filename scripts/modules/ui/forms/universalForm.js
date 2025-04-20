// @version: 2
// @file: /scripts/modules/ui/forms/universalForm.js

import {
    createTextField,
    createDropdownField,
    createTextareaFieldWithColor,
    createImageField,
    createVideoField,
    createExtraInfoBlock
  } from "../../ui/uiKit.js";
  
  import { createTopAlignedFieldRow } from "../../utils/formUtils.js"; 
  
  /**
   * Builds a basic name field with color.
   */
  export function createNameField(id = "fld-name") {
    return createTextField("Name:", id);
  }
  
  /**
   * Builds a colored dropdown for rarity.
   */
  export function createRarityField(id = "fld-rarity") {
    return createDropdownField("Rarity:", id, [
      { value: "", label: "Select Rarity" },
      { value: "common", label: "Common" },
      { value: "uncommon", label: "Uncommon" },
      { value: "rare", label: "Rare" },
      { value: "epic", label: "Epic" },
      { value: "legendary", label: "Legendary" }
    ]);
  }
  
  /**
   * Builds a colored dropdown for item type.
   */
  export function createItemTypeField(id = "fld-item-type") {
    return createDropdownField("Item Type:", id, [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special", label: "Special" },
      { value: "Consumable", label: "Consumable" },
      { value: "Quest", label: "Quest" }
    ]);
  }
  
  /**
   * Description with color support
   */
  export function createDescriptionField(id = "fld-desc-item") {
    return createTextareaFieldWithColor("Description:", id);
  }
  
  /**
   * Creates extra info section with label + block layout
   */
  export function createExtraInfoField() {
    const extra = createExtraInfoBlock();
    const row = createTopAlignedFieldRow("Extra Info:", extra.block);
    return { row, extraInfo: extra };
  }
  
  /**
   * Image + video field bundle
   */
  export function createImageFieldSet() {
    const imgS = createImageField("Image S:", "fld-img-s");
    const imgL = createImageField("Image L:", "fld-img-l");
    const vid = createVideoField("Video:", "fld-vid");
    return {
      rowImgS: imgS.row, fldImgS: imgS.input,
      rowImgL: imgL.row, fldImgL: imgL.input,
      rowVid: vid.row, fldVid: vid.input
    };
  }
  
  /**
   * Value field with color
   */
  export function createValueField(id = "fld-value") {
    return createTextField("Value:", id);
  }
  
  /**
   * Quantity field with color
   */
  export function createQuantityField(id = "fld-quantity") {
    return createTextField("Quantity:", id);
  }
  