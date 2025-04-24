// @version: 3
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js

import { createNameField, createExtraInfoField } from "../universalForm.js";
// ← fixed path: up two levels into /scripts/modules/ui, then uiKit.js
import { createDropdownField, createTextField }  from "../../uiKit.js";

/**
 * Builds the NPC form with fields:
 * - Name (text + color)
 * - NPC Type (dropdown + color)
 * - HP (text + color)
 * - Extra Info (optional lines with their own colors)
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // Name
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createNameField("npc-fld-name");
  colorName.id = "npc-fld-name-color";
  colorName.classList.add("color-swatch");

  // NPC Type
  const npcTypes = [
    { value: "vendor",      label: "Vendor" },
    { value: "quest-giver", label: "Quest Giver" },
    { value: "enemy",       label: "Enemy" },
    { value: "ally",        label: "Ally" }
  ];
  const { row: rowType, select: fldType, colorBtn: colorType } =
    createDropdownField("NPC Type:", "npc-fld-type", npcTypes);
  colorType.id = "npc-fld-type-color";
  colorType.classList.add("color-swatch");

  // HP
  const { row: rowHp, input: fldHp, colorBtn: colorHp } =
    createTextField("HP:", "npc-fld-hp");
  colorHp.id = "npc-fld-hp-color";
  colorHp.classList.add("color-swatch");

  // Extra Info (lines of text+color)
  const extraBlock = createExtraInfoField({ withDividers: true });
  const rowExtra = extraBlock.row;
  rowExtra.querySelector("label").textContent = "Extra Info:";

  form.append(rowName, rowType, rowHp, rowExtra);

  return {
    form,
    fields: {
      fldName,   colorName,
      fldType,   colorType,
      fldHp,     colorHp,
      extraInfo: extraBlock.extraInfo
    }
  };
}
