// @file: src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.7 — use fieldKit & extraInfoBlock; reorder image fields

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField
} from "../../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../../components/uiKit/extraInfoBlock.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name", "fld-chest-name");

  // — Category —
  const { row: rowCategory, select: fldCategory } =
    createDropdownField(
      "Category",
      "fld-chest-category",
      [
        { value: "Normal",    label: "Normal"    },
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
  // (controller will wire up chipContainer & cog button)
  const rowLoot = document.createElement("div");
  rowLoot.className = "field-row loot-pool-row";
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  const lootWrapper = document.createElement("div");
  lootWrapper.className = "loot-pool-wrapper";
  const chipContainer = document.createElement("div");
  chipContainer.className = "loot-pool-chip-container";
  const btnCog = document.createElement("button");
  btnCog.type = "button";
  btnCog.className = "loot-pool-cog";
  btnCog.innerHTML = "⚙️";
  lootWrapper.append(chipContainer, btnCog);
  rowLoot.append(lblLoot, lootWrapper);

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-chest-desc");

  // — Extra Info —
  const extraInfo = createExtraInfoBlock();

  // — Image S & L —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Image S", "fld-chest-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Image L", "fld-chest-img-l");

  // Append in the desired order
  form.append(
    rowName,
    rowCategory,
    rowSize,
    rowLoot,
    rowDesc,
    extraInfo.block,
    rowImgS,
    rowImgL
  );

  return {
    form,
    fields: {
      fldName,
      fldCategory,
      fldSize,
      lootPool: [],
      chipContainer,
      openLootPicker: btnCog,
      fldDesc,
      colorDesc,
      extraInfo,
      fldImgS,
      fldImgL
    }
  };
}
