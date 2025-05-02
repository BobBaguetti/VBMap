// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 2.4 – chip-style picker buttons for loot & vendor + notes block

import { createTextField }          from "../../uiKit.js";
import { createExtraInfoField }     from "../universalForm.js";
import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPoolBlock, openLootPicker,
 *   vendorInvBlock, openVendorPicker,
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
    cb.type = "checkbox"; cb.value = label.toLowerCase();
    const lbl = document.createElement("label");
    lbl.append(cb, document.createTextNode(" " + label));
    typeContainer.append(lbl, document.createTextNode(" "));
  });
  const rowTypes = createTopAlignedFieldRow("NPC Roles:", typeContainer);
  const fldTypeFlags = Array.from(typeContainer.querySelectorAll("input"));

  // — Health & Damage —
  const { row: rowHealth, input: fldHealth } =
    createTextField("Health:", "npc-fld-health");
  fldHealth.type = "number"; fldHealth.min = "0";

  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage:", "npc-fld-damage");
  fldDamage.type = "number"; fldDamage.min = "0";

  // — Loot Pool —
  const lootExtra = createExtraInfoField({ withDividers: true });
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button";
  openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title = "Edit Loot Pool";
  lootExtra.row.append(openLootPicker);
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", lootExtra.row);

  // — Vendor Inventory —
  const vendExtra = createExtraInfoField({ withDividers: true });
  const openVendorPicker = document.createElement("button");
  openVendorPicker.type = "button";
  openVendorPicker.className = "ui-button";
  openVendorPicker.textContent = "⚙︎";
  openVendorPicker.title = "Edit Vendor Inventory";
  vendExtra.row.append(openVendorPicker);
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", vendExtra.row);

  // — Notes —
  const notesExtra = createExtraInfoField({ withDividers: true });
  const rowNotes   = createTopAlignedFieldRow("Notes:", notesExtra.row);

  // Assemble
  form.append(
    rowName,
    rowTypes,
    rowHealth,
    rowDamage,
    rowLoot,
    rowVend,
    rowNotes
  );

  return {
    form,
    fields: {
      fldName,
      fldTypeFlags,
      fldHealth,
      fldDamage,

      // Loot pool controls
      lootPoolBlock: lootExtra.extraInfo,    // .block, .getLines(), .setLines()
      openLootPicker,

      // Vendor inventory controls
      vendorInvBlock: vendExtra.extraInfo,   // .block, .getLines(), .setLines()
      openVendorPicker,

      // Free-form notes
      extraInfoBlock: notesExtra.extraInfo
    }
  };
}
