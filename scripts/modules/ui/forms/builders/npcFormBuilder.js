// @version: 3.0 — add Description + Extra Info block
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js

import { createTextField }        from "../../uiKit.js";
import { createDescriptionField, createExtraInfoField } from "../universalForm.js";
import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPoolBlock, openLootPicker,
 *   vendorInvBlock, openVendorPicker,
 *   fldDesc, colorDesc,
 *   extraInfoBlock
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "npc-fld-name");

  // — NPC Roles —
  const typeContainer = document.createElement("div");
  ["Hostile","Vendor","Quest-Giver"].forEach(label => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = label.toLowerCase();
    const lbl = document.createElement("label");
    lbl.append(cb, document.createTextNode(" " + label));
    typeContainer.append(lbl, document.createTextNode(" "));
  });
  const rowTypes = createTopAlignedFieldRow("NPC Roles:", typeContainer);
  const fldTypeFlags = Array.from(typeContainer.querySelectorAll("input"));

  // — Health & Damage —
  const { row: rowHealth, input: fldHealth } =
    createTextField("Health:", "npc-fld-health");
  fldHealth.type = "number";
  fldHealth.min  = "0";

  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage:", "npc-fld-damage");
  fldDamage.type = "number";
  fldDamage.min  = "0";

  // — Loot Pool —
  const lootExtra   = createExtraInfoField({ withDividers: true });
  const btnLootGear = document.createElement("button");
  btnLootGear.type        = "button";
  btnLootGear.className   = "ui-button";
  btnLootGear.textContent = "⚙︎";
  btnLootGear.title       = "Edit Loot Pool";
  lootExtra.row.append(btnLootGear);
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", lootExtra.row);

  // — Vendor Inventory —
  const vendExtra   = createExtraInfoField({ withDividers: true });
  const btnVendGear = document.createElement("button");
  btnVendGear.type        = "button";
  btnVendGear.className   = "ui-button";
  btnVendGear.textContent = "⚙︎";
  btnVendGear.title       = "Edit Vendor Inventory";
  vendExtra.row.append(btnVendGear);
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", vendExtra.row);

  // — Description —
  const {
    row:      rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createDescriptionField();
  colorDesc.id = "npc-fld-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info under Description —
  const notesExtra = createExtraInfoField({ withDividers: true });
  const rowNotes   = createTopAlignedFieldRow("Notes:", notesExtra.row);

  // Assemble all rows
  form.append(
    rowName,
    rowTypes,
    rowHealth,
    rowDamage,
    rowLoot,
    rowVend,
    rowDesc,
    rowNotes
  );

  return {
    form,
    fields: {
      fldName,
      fldTypeFlags,
      fldHealth,
      fldDamage,

      // Loot‐pool
      lootPoolBlock:   lootExtra.extraInfo,
      openLootPicker:  btnLootGear,

      // Vendor inventory
      vendorInvBlock:  vendExtra.extraInfo,
      openVendorPicker: btnVendGear,

      // Description
      fldDesc,
      colorDesc,

      // Free‐form notes
      extraInfoBlock:  notesExtra.extraInfo
    }
  };
}
