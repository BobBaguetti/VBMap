// @file: src/modules/ui/forms/builders/npcFormBuilder.js
// @version: 1.0 - form builder for NPC definitions

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createChipListField,
  createExtraInfoField
} from "../../components/uiKit/fieldKit.js";

/**
 * Builds the NPC definition form.
 * @returns {{ form: HTMLFormElement, fields: object }}
 */
export function createNPCForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name", "fld-npc-name");

  // — Dev Name —
  const { row: rowDev, input: fldDevName } =
    createTextField("Dev Name", "fld-npc-devName");

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-npc-desc");
  colorDesc.classList.add("color-swatch");

  // — Icon Small & Large —
  const { row: rowImgS, input: fldImgS } =
    createImageField("Icon Small", "fld-npc-img-s");
  const { row: rowImgL, input: fldImgL } =
    createImageField("Icon Large", "fld-npc-img-l");

  // — Is Hostile —
  const { row: rowHostile, select: fldHostile } =
    createDropdownField(
      "Hostile?",
      "fld-npc-hostile",
      [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" }
      ],
      { showColor: false }
    );

  // — Health & Damage —
  const { row: rowHealth, input: fldHealth } =
    createTextField("Health", "fld-npc-health");
  fldHealth.type = "number";

  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage", "fld-npc-damage");
  fldDamage.type = "number";

  // — Loot Table —
  const allItems = [];
  const {
    row: rowLoot,
    getItems: getLoot,
    setItems: setLoot
  } = createChipListField("Loot Table", [], {
    items: allItems,
    idKey: "id",
    labelKey: "name",
    renderIcon: item => item.imageSmall
  });

  // — Extra Info —
  const { row: rowExtras, extraInfo } =
    createExtraInfoField({ withDividers: true });

  // — Show in Filters —
  const { row: rowShow, select: fldShowInFilters } =
    createDropdownField(
      "Show In Filters",
      "fld-npc-show",
      [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" }
      ],
      { showColor: false }
    );

  // Append rows
  form.append(
    rowName,
    rowDev,
    rowDesc,
    rowImgS,
    rowImgL,
    rowHostile,
    rowHealth,
    rowDamage,
    rowLoot,
    rowExtras,
    rowShow
  );

  // Collect fields for controller
  const fields = {
    fldName,
    fldDevName,
    fldDesc,
    colorDesc,
    fldImgS,
    fldImgL,
    fldHostile,
    fldHealth,
    fldDamage,
    lootItems: allItems,
    getLoot,
    setLoot,
    extraInfo,
    fldShowInFilters
  };

  return { form, fields };
}
