// @version: 2
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js

import {
  createTextField,
  createDropdownField,
  createExtraInfoField
} from "../universalForm.js";

/**
 * Builds the NPC form with fields:
 * - Name (text + color)
 * - NPC Type (dropdown + color)
 * - HP (text + color)
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // Name
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name:", "npc-fld-name");
  colorName.id = "npc-fld-name-color";

  // NPC Type
  const npcTypes = [
    { value: "vendor", label: "Vendor" },
    { value: "quest-giver", label: "Quest Giver" },
    { value: "enemy", label: "Enemy" },
    { value: "ally", label: "Ally" }
  ];
  const { row: rowType, select: fldType, colorBtn: colorType } =
    createDropdownField("NPC Type:", "npc-fld-type", npcTypes);
  colorType.id = "npc-fld-type-color";

  // HP
  const { row: rowHp, input: fldHp, colorBtn: colorHp } =
    createTextField("HP:", "npc-fld-hp");
  colorHp.id = "npc-fld-hp-color";

  form.append(rowName, rowType, rowHp);

  return {
    form,
    fields: {
      fldName, colorName,
      fldType, colorType,
      fldHp,   colorHp
    }
  };
}
