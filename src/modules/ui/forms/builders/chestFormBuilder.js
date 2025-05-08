// @file: /src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.5 – add size & category fields, keep description color swatch

import {
  createDescriptionField,
  createExtraInfoField
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

  // — Icon URL —
  const rowIcon = document.createElement("div");
  rowIcon.classList.add("field-row");
  const lblIcon = document.createElement("label");
  lblIcon.htmlFor = "fld-chest-icon";
  lblIcon.textContent = "Icon URL";
  const fldIcon = document.createElement("input");
  fldIcon.type = "text";
  fldIcon.id   = "fld-chest-icon";
  rowIcon.append(lblIcon, fldIcon);

  // — Subtext —
  const rowSub = document.createElement("div");
  rowSub.classList.add("field-row");
  const lblSub = document.createElement("label");
  lblSub.htmlFor = "fld-chest-subtext";
  lblSub.textContent = "Subtext";
  const fldSub = document.createElement("input");
  fldSub.type = "text";
  fldSub.id   = "fld-chest-subtext";
  rowSub.append(lblSub, fldSub);

  // — Loot Pool —
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  const chipContainer = document.createElement("div");
  chipContainer.classList.add("loot-pool-chips");
  chipContainer.id = "fld-chest-loot-chips";
  Object.assign(chipContainer.style, {
    flex:     "1",
    display:  "flex",
    flexWrap: "wrap",
    gap:      "4px"
  });
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button";
  openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainer, openLootPicker);

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createDescriptionField();
  colorDesc.id = "fld-chest-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info —
  const { row: rowExtras, extraInfo } =
    createExtraInfoField({ withDividers: true });

  // assemble the form in logical order
  form.append(
    rowName,
    rowSize,
    rowCat,
    rowIcon,
    rowSub,
    rowLoot,
    rowDesc,
    rowExtras
  );

  return {
    form,
    fields: {
      fldName,
      fldSize,
      fldCategory,
      fldIconUrl:  fldIcon,
      fldSubtext:  fldSub,
      lootPool:    [],
      openLootPicker,
      chipContainer,
      fldDesc,
      colorDesc,
      extraInfo,
      rowExtras
    }
  };
}
