// @version: 2
// @file: /scripts/modules/ui/forms/builders/questFormBuilder.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createExtraInfoField
} from "../universalForm.js";

/**
 * Builds the Quest form with fields:
 * - Name (text + color)
 * - Description (textarea + color)
 * - Objectives (extra‐info block, can add multiple)
 * - Rewards (extra‐info block: item ID & quantity)
 */
export function createQuestForm() {
  const form = document.createElement("form");
  form.id = "quest-form";

  // Name
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name:", "quest-fld-name");
  colorName.id = "quest-fld-name-color";

  // Description
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description:", "quest-fld-desc");
  colorDesc.id = "quest-fld-desc-color";

  // Objectives (freeform list of text+color)
  const objBlock = createExtraInfoField({ withDividers: true });
  const rowObj = objBlock.row;
  // relabel it
  rowObj.querySelector("label").textContent = "Objectives:";
  
  // Rewards (list of item-quantity text + color)
  const rewBlock = createExtraInfoField({ withDividers: true });
  const rowRew = rewBlock.row;
  rowRew.querySelector("label").textContent = "Rewards:";

  form.append(rowName, rowDesc, rowObj, rowRew);
  return {
    form,
    fields: {
      fldName, colorName,
      fldDesc, colorDesc,
      objectives: objBlock.extraInfo,
      rewards:    rewBlock.extraInfo
    },
    rows: {
      rowObj,
      rowRew
    }
  };
}
