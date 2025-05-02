// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 2.1 – switch loot & vendor sections to ExtraInfoField blocks

import { createTextField }           from "../../uiKit.js";
import { createExtraInfoField }      from "../universalForm.js";
import { createTopAlignedFieldRow }  from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPool (array of IDs), openLootPicker, lootPoolBlock,
 *   vendorInv (array of IDs), openVendorPicker, vendorInvBlock,
 *   extraInfoBlock
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "npc-fld-name");

  // — Type flags —
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
  // add our picker button into the label row
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button"; openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎"; openLootPicker.title = "Edit Loot Pool";
  lootExtra.row.append(openLootPicker);
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", lootExtra.row);

  // — Vendor Inventory —
  const vendExtra = createExtraInfoField({ withDividers: true });
  const openVendorPicker = document.createElement("button");
  openVendorPicker.type = "button"; openVendorPicker.className = "ui-button";
  openVendorPicker.textContent = "⚙︎"; openVendorPicker.title = "Edit Vendor Inventory";
  vendExtra.row.append(openVendorPicker);
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", vendExtra.row);

  // — Free‐form notes —
  const descExtra = createExtraInfoField({ withDividers: true });
  const rowDesc   = createTopAlignedFieldRow("Notes:", descExtra.row);

  // Assemble
  form.append(
    rowName,
    rowTypes,
    rowHealth,
    rowDamage,
    rowLoot,
    rowVend,
    rowDesc
  );

  return {
    form,
    fields: {
      fldName,
      fldTypeFlags,
      fldHealth,
      fldDamage,

      // Loot‐pool
      lootPool:       [],              // array of selected IDs
      openLootPicker,                   // picker trigger
      lootPoolBlock:  lootExtra.extraInfo, // has .block, .setLines(), .getLines()

      // Vendor inventory
      vendorInv:         [],           // array of selected IDs
      openVendorPicker,                 // picker trigger
      vendorInvBlock:    vendExtra.extraInfo,

      // Notes
      extraInfoBlock:    descExtra.extraInfo
    }
  };
}
