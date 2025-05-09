// @version: 2.9
// @file: src/modules/ui/forms/builders/chestFormBuilder.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField,
  createChipListField
} from "../../components/uiKit/fieldKit.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // — Name —
  const {
    row: rowName,
    input: fldName,
    colorBtn: colorName
  } = createTextField("Name", "fld-chest-name");
  colorName.id = "fld-chest-name-color";
  colorName.classList.add("color-swatch");

  // — Category —
  const {
    row: rowCategory,
    select: fldCategory
  } = createDropdownField(
    "Category",
    "fld-chest-category",
    [
      { value: "Normal",     label: "Normal"     },
      { value: "Dragonvault", label: "Dragonvault" }
    ],
    { showColor: false }
  );

  // — Size —
  const {
    row: rowSize,
    select: fldSize
  } = createDropdownField(
    "Size",
    "fld-chest-size",
    [
      { value: "Small",  label: "Small"  },
      { value: "Medium", label: "Medium" },
      { value: "Large",  label: "Large"  }
    ],
    { showColor: false }
  );

  // — Loot Pool —
  // `allItems` will be populated by the controller
  const allItems = [];
  const {
    row: rowLoot,
    getItems: getLootPool,
    setItems: setLootPool
  } = createChipListField("Loot Pool", [], {
    items:     allItems,
    idKey:     "id",
    labelKey:  "name",
    renderIcon:item => item.imageSmall
  });

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-chest-desc");
  colorDesc.id = "fld-chest-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info (with dividers & top alignment) —
  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  // — Image S & L —
  const {
    row: rowImgS,
    input: fldImgS
  } = createImageField("Image S", "fld-chest-img-s");
  const {
    row: rowImgL,
    input: fldImgL
  } = createImageField("Image L", "fld-chest-img-l");

  // Append all rows in order
  form.append(
    rowName,
    rowCategory,
    rowSize,
    rowLoot,
    rowDesc,
    rowExtras,
    rowImgS,
    rowImgL
  );

  // Expose fields and chip-list handlers to the controller
  const fields = {
    fldName,
    colorName,
    fldCategory,
    fldSize,

    // Loot-pool: selected IDs, helper funcs, and the master list
    lootPool:     [],
    allItems,     // <— expose here
    getLootPool,
    setLootPool,

    // Other fields
    fldDesc,
    colorDesc,
    extraInfo,
    fldImgS,
    fldImgL
  };

  return { form, fields };
}
