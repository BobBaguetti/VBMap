// @file: src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 2.5 — reposition loot-pool cog under label

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createFieldRow
} from "../../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../../components/uiKit/extraInfoBlock.js";

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
  const rowLoot = document.createElement("div");
  rowLoot.className = "field-row loot-pool-row";

  // Label
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  lblLoot.htmlFor = "fld-chest-loot";  // ensure label-for if needed

  // Cog button now goes directly under the label
  const btnCog = document.createElement("button");
  btnCog.type      = "button";
  btnCog.className = "loot-pool-cog open-loot-picker";
  btnCog.innerHTML = "⚙️";

  // Wrapper for chips only
  const lootWrapper = document.createElement("div");
  lootWrapper.className = "loot-pool-wrapper";

  const chipContainer = document.createElement("div");
  chipContainer.className = "loot-pool-chip-container";
  lootWrapper.append(chipContainer);

  // Assemble row: label, then cog, then chip wrapper
  rowLoot.append(lblLoot, btnCog, lootWrapper);

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-chest-desc");
  colorDesc.id = "fld-chest-desc-color";

  // — Extra Info —
  const extraInfo = createExtraInfoBlock();
  const rowExtras = createFieldRow("Extra Info", extraInfo.block);

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

  return {
    form,
    fields: {
      fldName,
      colorName,
      fldCategory,
      fldSize,
      lootPool:         [],
      chipContainer,
      openLootPicker:   btnCog,
      fldDesc,
      colorDesc,
      extraInfo,
      fldImgS,
      fldImgL
    }
  };
}
