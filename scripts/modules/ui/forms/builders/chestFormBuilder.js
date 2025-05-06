// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 2.3 – updated imports to use fieldBuilders.js

import {
  createTextField,
  createDropdownField
} from "../../components/fieldBuilders.js";

import {
  createDescriptionField,
  createExtraInfoField
} from "../universalForm.js";

/**
 * Build the chest form.
 *
 * @param {string} [idPrefix="chest"]
 * @returns {{ form: HTMLFormElement, fields: Object }}
 */
export function createChestForm(idPrefix = "chest") {
  const form = document.createElement("form");
  form.id = `${idPrefix}-form`;

  // Name
  const { row: rowName, input: fldName } =
    createTextField("Name:", `fld-${idPrefix}-name`);

  // Size
  const sizeOpts = ["Small", "Medium", "Large"].map(o => ({ value: o, label: o }));
  const { row: rowSize, select: fldSize } =
    createDropdownField("Size:", `fld-${idPrefix}-size`, sizeOpts, { showColor: false });

  // Category
  const catOpts = ["Normal", "Dragonvault"].map(o => ({ value: o, label: o }));
  const { row: rowCat, select: fldCategory } =
    createDropdownField("Category:", `fld-${idPrefix}-category`, catOpts, { showColor: false });

  // Icon URL
  const { row: rowIcon, input: fldIcon } =
    createTextField("Icon URL:", `fld-${idPrefix}-icon`);

  // Subtext
  const { row: rowSub, input: fldSubtext } =
    createTextField("Subtext:", `fld-${idPrefix}-subtext`);

  // Loot Pool (chips + picker button; wired by controller)
  const rowLoot = document.createElement("div");
  rowLoot.className = "field-row";
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  const chipContainer = document.createElement("div");
  chipContainer.className = "loot-pool-chips";
  chipContainer.id = `fld-${idPrefix}-loot-chips`;
  const openPickerBtn = document.createElement("button");
  openPickerBtn.type = "button";
  openPickerBtn.className = "ui-button";
  openPickerBtn.textContent = "⚙︎";
  openPickerBtn.title = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainer, openPickerBtn);

  // Description + color swatch
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createDescriptionField(`fld-${idPrefix}-description`);

  // Extra Info rows
  const { row: rowExtras, extraInfo } =
    createExtraInfoField({ withDividers: true });

  // Assemble form fields
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
      fldIcon,
      fldSubtext,
      lootPool: [],
      chipContainer,
      openLootPicker: openPickerBtn,
      fldDesc,
      colorDesc,
      extraInfo
    }
  };
}
