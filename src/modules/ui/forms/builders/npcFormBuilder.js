// @file: src/modules/ui/forms/builders/npcFormBuilder.js
// @version: 1.0 — form builder for NPC definitions

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField
} from "../../components/uiKit/fieldKit.js";

export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name", "fld-npc-name");

  // — Dev Name —
  const { row: rowDev, input: fldDevName } =
    createTextField("Dev Name", "fld-npc-devName");

  // — Description —
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description", "fld-npc-description");
  colorDesc.classList.add("color-swatch");

  // — Extra Info —
  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  // — Icon S & L —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Icon Small URL", "fld-npc-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Icon Large URL", "fld-npc-img-l");

  // — Hostile / Friendly —
  const { row: rowHostile, select: fldHostile } =
    createDropdownField(
      "Hostility",
      "fld-npc-hostile",
      [
        { value: "true",  label: "Hostile" },
        { value: "false", label: "Friendly" }
      ]
    );

  // — Health & Damage —
  const { row: rowHealth, input: fldHealth } =
    createTextField("Health", "fld-npc-health");
  fldHealth.type = "number";
  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage", "fld-npc-damage");
  fldDamage.type = "number";

  // — Faction (optional) —
  const { row: rowFaction, input: fldFaction } =
    createTextField("Faction", "fld-npc-faction");

  // Append in order
  form.append(
    rowName,
    rowDev,
    rowDesc,
    rowExtras,
    rowImgS,
    rowImgL,
    rowHostile,
    rowHealth,
    rowDamage,
    rowFaction
  );

  return {
    form,
    fields: {
      fldName,
      fldDevName,
      fldDesc,   colorDesc,
      extraInfo,
      fldImgS,   fldImgL,
      fldHostile,
      fldHealth, fldDamage,
      fldFaction
    }
  };
}
