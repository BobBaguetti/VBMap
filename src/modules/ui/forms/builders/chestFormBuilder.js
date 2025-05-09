// @version: 2.7
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
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name", "fld-chest-name");
  colorName.id = "fld-chest-name-color";
  colorName.classList.add("color-swatch");

  // — Category —
  const { row: rowCategory, select: fldCategory } =
    createDropdownField("Category", "fld-chest-category", [
      { value: "Normal",     label: "Normal"     },
      { value: "Dragonvault", label: "Dragonvault" }
    ], { showColor: false });

  // — Size —
  const { row: rowSize, select: fldSize } =
    createDropdownField("Size", "fld-chest-size", [
      { value: "Small",  label: "Small"  },
      { value: "Medium", label: "Medium" },
      { value: "Large",  label: "Large"  }
    ], { showColor: false });

  // — Loot Pool —
  // initialItems = [], opts.items will be injected by your controller
  const {
    row: rowLoot,
    getItems: getLootPool,
    setItems: setLootPool
  } = createChipListField("Loot Pool", [], {
    items: [],          // controller can call setItems(allDefs)
    idKey: "id",
    labelKey: "name",
    renderIcon: item => item.imageSmall,
    onChange: updated => {
      // keep your field-array in sync for formStateManager
      fields.lootPool.splice(0, fields.lootPool.length, ...updated.map(i => i.id));
      onFieldChange?.(getCustom());
    }
  });

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-chest-desc");
  colorDesc.id = "fld-chest-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info —
  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  // — Image S & L —
  const { row: rowImgS, input: fldImgS } = createImageField("Image S", "fld-chest-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L", "fld-chest-img-l");

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

  // expose lootPool array for controller & formStateManager
  const fields = {
    fldName,
    colorName,
    fldCategory,
    fldSize,
    lootPool: [],        // will hold array of IDs
    getLootPool,         // to pull current objects if needed
    setLootPool,         // to seed the picker with full defs
    fldDesc,
    colorDesc,
    extraInfo,
    fldImgS,
    fldImgL
  };

  return { form, fields };
}
