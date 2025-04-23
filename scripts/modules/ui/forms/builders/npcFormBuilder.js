// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 1.1

import {
  createNameField,
  createDescriptionField,
  createExtraInfoField
} from "../universalForm.js";

export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-definition-form";

  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add NPC";
  subheadingWrap.appendChild(subheading);

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("npc-name");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("npc-description");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });

  form.append(rowName, rowDesc, rowExtra);

  return {
    form,
    fields: {
      fldName,
      fldDesc,
      extraInfo,
      colorName,
      colorDesc
    },
    subheadingWrap,
    subheading
  };
}
