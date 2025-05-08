// @file: /src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.6 — remove iconUrl/subtext; reorder image fields

import {
  createDescriptionField,
  createExtraInfoField,
  createImageField
} from "../universalForm.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // — Name —
  const rowName = document.createElement("div");
  rowName.classList.add("field-row");
  const lblName = document.createElement("label");
  lblName.htmlFor = "fld-chest-name";
  lblName.textContent = "Name";
  const fldName = document.createElement("input");
  fldName.type = "text";
  fldName.id   = "fld-chest-name";
  rowName.append(lblName, fldName);

  // — Category —
  const rowCat = document.createElement("div");
  rowCat.classList.add("field-row");
  const lblCat = document.createElement("label");
  lblCat.htmlFor = "fld-chest-category";
  lblCat.textContent = "Category";
  const fldCategory = document.createElement("select");
  fldCategory.id = "fld-chest-category";
  ["Normal", "Dragonvault"].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    fldCategory.appendChild(o);
  });
  rowCat.append(lblCat, fldCategory);

  // — Size —
  const rowSize = document.createElement("div");
  rowSize.classList.add("field-row");
  const lblSize = document.createElement("label");
  lblSize.htmlFor = "fld-chest-size";
  lblSize.textContent = "Size";
  const fldSize = document.createElement("select");
  fldSize.id = "fld-chest-size";
  ["Small", "Medium", "Large"].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    fldSize.appendChild(o);
  });
  rowSize.append(lblSize, fldSize);

  // — Loot Pool —
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row", "loot-pool-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  // we'll wire up the chip container + cog button in the controller
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
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createDescriptionField();
  colorDesc.id = "fld-chest-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info —
  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  // — Image S & L —
  const rowImgS = document.createElement("div");
  rowImgS.classList.add("field-row");
  const lblImgS = document.createElement("label");
  lblImgS.htmlFor = "fld-chest-img-s";
  lblImgS.textContent = "Image S";
  const fldImgS = document.createElement("input");
  fldImgS.type = "text";
  fldImgS.id   = "fld-chest-img-s";
  rowImgS.append(lblImgS, fldImgS);

  const rowImgL = document.createElement("div");
  rowImgL.classList.add("field-row");
  const lblImgL = document.createElement("label");
  lblImgL.htmlFor = "fld-chest-img-l";
  lblImgL.textContent = "Image L";
  const fldImgL = document.createElement("input");
  fldImgL.type = "text";
  fldImgL.id   = "fld-chest-img-l";
  rowImgL.append(lblImgL, fldImgL);

  // Append in final, specified order:
  form.append(
    rowName,
    rowCat,
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
      fldCategory,
      fldSize,
      // for controller wiring
      lootPool:         [],
      chipContainer,
      openLootPicker:   btnCog,
      fldDesc,
      colorDesc,
      extraInfo,
      rowExtras,
      fldImgS,
      fldImgL
    }
  };
}
