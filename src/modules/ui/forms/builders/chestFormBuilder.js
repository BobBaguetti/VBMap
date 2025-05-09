// @version: 2.6
// @file: src/modules/ui/forms/builders/chestFormBuilder.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoRow
} from "../../components/uiKit/fieldKit.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // — Name —
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name:", "fld-chest-name");
  colorName.id = "fld-chest-name-color";
  colorName.classList.add("color-swatch");

  // — Category —
  const { row: rowCategory, select: fldCategory } =
    createDropdownField("Category:", "fld-chest-category", [
      { value: "Normal",     label: "Normal"     },
      { value: "Dragonvault", label: "Dragonvault" }
    ], { showColor: false });

  // — Size —
  const { row: rowSize, select: fldSize } =
    createDropdownField("Size:", "fld-chest-size", [
      { value: "Small",  label: "Small"  },
      { value: "Medium", label: "Medium" },
      { value: "Large",  label: "Large"  }
    ], { showColor: false });

  // — Loot Pool UI (unchanged) —
  const rowLoot = document.createElement("div");
  rowLoot.className = "field-row loot-pool-row";
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool:";
  const lootWrapper = document.createElement("div");
  lootWrapper.className = "loot-pool-wrapper";
  const chipContainer = document.createElement("div");
  chipContainer.className = "loot-pool-chip-container";
  const btnCog = document.createElement("button");
  btnCog.type      = "button";
  btnCog.className = "loot-pool-cog";
  btnCog.textContent = "⚙️";
  lootWrapper.append(chipContainer, btnCog);
  rowLoot.append(lblLoot, lootWrapper);

  // — Description —
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description:", "fld-chest-desc");
  colorDesc.id = "fld-chest-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info (use full helper) —
  const extraInfo = createExtraInfoRow({ withDividers: true });
  const extraContainer = extraInfo.container;
  const rowExtra       = extraInfo.row;

  // — Images —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S:", "fld-chest-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L:", "fld-chest-img-l");

  // assemble form
  form.append(
    rowName,
    rowCategory,
    rowSize,
    rowLoot,
    rowDesc,
    extraContainer,
    rowImgS,
    rowImgL
  );

  return {
    form,
    fields: {
      fldName,
      colorName,
      fldCategory,
      fldSize,
      lootPool:       [],          // will be populated by controller
      chipContainer,
      openLootPicker: btnCog,
      fldDesc,
      colorDesc,
      extraInfo,    // now the full helper object with setLines/getLines
      rowExtra,     // in case you need to tweak styling
      fldImgS,
      fldImgL
    }
  };
}
