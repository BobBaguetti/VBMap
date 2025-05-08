// @file: src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 2.4 — add name color swatch and expose it to controller

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

  // — Name (with color swatch) —
  const {
    row: rowName,
    input: fldName,
    colorBtn: colorName
  } = createTextField("Name", "fld-chest-name");
  // give it the “color-swatch” class so initFormPickrs picks it up
  colorName.classList.add("color-swatch");
  colorName.id = "fld-chest-name-color";

  // — Category —
  const { row: rowCategory, select: fldCategory } =
    createDropdownField(
      "Category",
      "fld-chest-category",
      [
        { value: "Normal",     label: "Normal"     },
        { value: "Dragonvault", label: "Dragonvault" }
      ],
      { showColor: false }
    );

  // — Size —
  const { row: rowSize, select: fldSize } =
    createDropdownField(
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
  const rowLoot = document.createElement("div");
  rowLoot.className = "field-row loot-pool-row";
  const lblLoot = document.createElement("label"); lblLoot.textContent = "Loot Pool";
  const lootWrapper = document.createElement("div"); lootWrapper.className = "loot-pool-wrapper";
  const chipContainer = document.createElement("div"); chipContainer.className = "loot-pool-chip-container";
  const btnCog = document.createElement("button");
  btnCog.type = "button"; btnCog.className = "loot-pool-cog"; btnCog.innerHTML = "⚙️";
  lootWrapper.append(chipContainer, btnCog);
  rowLoot.append(lblLoot, lootWrapper);

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
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S", "fld-chest-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L", "fld-chest-img-l");

  // — Assemble in order —
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
      colorName,      // expose color swatch
      fldCategory,
      fldSize,
      lootPool:        [],
      chipContainer,
      openLootPicker:  btnCog,
      fldDesc,
      colorDesc,
      extraInfo,
      fldImgS,
      fldImgL
    }
  };
}
