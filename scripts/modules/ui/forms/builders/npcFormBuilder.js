// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 1.0 — upgraded: hostile/vendor/quest flags + health/damage + loot & vendor inventory

import {
  createTextField,
  createNumberField
} from "../../../uiKit.js";
import { createExtraInfoBlock } from "../../../uiKit.js";
import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPoolBlock, vendorInvBlock, extraInfoBlock
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "npc-fld-name");

  // — Type flags —
  const typeContainer = document.createElement("div");
  ["Hostile", "Vendor", "Quest-Giver"].forEach(label => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = label.toLowerCase();
    cb.dataset.typeFlag = label;
    const lbl = document.createElement("label");
    lbl.append(cb, document.createTextNode(" " + label));
    typeContainer.append(lbl, document.createTextNode(" "));
  });
  const rowTypes = createTopAlignedFieldRow("NPC Roles:", typeContainer);
  const fldTypeFlags = Array.from(typeContainer.querySelectorAll("input"));

  // — Health & Damage —
  const { row: rowHealth, input: fldHealth } =
    createNumberField("Health:", "npc-fld-health", { min: 0 });
  const { row: rowDamage, input: fldDamage } =
    createNumberField("Damage:", "npc-fld-damage", { min: 0 });

  // — Loot Pool (hostile drops) —
  const lootExtra = createExtraInfoBlock();
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", lootExtra.block);

  // — Vendor Inventory (for vendors) —
  const vendExtra = createExtraInfoBlock();
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", vendExtra.block);

  // — Description / Notes —
  const descExtra = createExtraInfoBlock();
  const rowDesc = createTopAlignedFieldRow("Description / Notes:", descExtra.block);

  // Assemble in order
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
      fldTypeFlags,      // Array of the 3 checkboxes
      fldHealth,
      fldDamage,
      lootPoolBlock: lootExtra,
      vendorInvBlock: vendExtra,
      extraInfoBlock: descExtra
    }
  };
}
