// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 2.0 – chip‐style pickers for loot & vendor inventory

import { createTextField } from "../../uiKit.js";
import { createExtraInfoField } from "../universalForm.js";
import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPool (array of IDs), openLootPicker, chipContainer,
 *   vendorInv (array of IDs), openVendorPicker, chipContainerVendor,
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
  ["Hostile", "Vendor", "Quest-Giver"].forEach(label => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = label.toLowerCase();
    const lbl = document.createElement("label");
    lbl.append(cb, document.createTextNode(" " + label));
    typeContainer.append(lbl, document.createTextNode(" "));
  });
  const rowTypes = createTopAlignedFieldRow("NPC Roles:", typeContainer);
  const fldTypeFlags = Array.from(typeContainer.querySelectorAll("input"));

  // — Health & Damage (numeric) —
  const { row: rowHealth, input: fldHealth } =
    createTextField("Health:", "npc-fld-health");
  fldHealth.type = "number"; fldHealth.min = "0";

  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage:", "npc-fld-damage");
  fldDamage.type = "number"; fldDamage.min = "0";

  // — Loot Pool (hostile drops) —
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool:";
  const chipContainer = document.createElement("div");
  chipContainer.classList.add("loot-pool-chips");
  Object.assign(chipContainer.style, {
    flex: "1", display: "flex", flexWrap: "wrap", gap: "4px"
  });
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button";
  openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainer, openLootPicker);

  // — Vendor Inventory (for vendors) —
  const rowVend = document.createElement("div");
  rowVend.classList.add("field-row");
  const lblVend = document.createElement("label");
  lblVend.textContent = "Vendor Inventory:";
  const chipContainerVend = document.createElement("div");
  chipContainerVend.classList.add("loot-pool-chips");
  Object.assign(chipContainerVend.style, {
    flex: "1", display: "flex", flexWrap: "wrap", gap: "4px"
  });
  const openVendorPicker = document.createElement("button");
  openVendorPicker.type = "button";
  openVendorPicker.className = "ui-button";
  openVendorPicker.textContent = "⚙︎";
  openVendorPicker.title = "Edit Vendor Inventory";
  rowVend.append(lblVend, chipContainerVend, openVendorPicker);

  // — Description / Notes —
  const descExtra = createExtraInfoField({ withDividers: true });
  const rowDesc   = createTopAlignedFieldRow("Notes:", descExtra.block);

  // Assemble form
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

      // Loot pool controls
      lootPool: [],
      openLootPicker,
      chipContainer,

      // Vendor inventory controls
      vendorInv: [],
      openVendorPicker,
      chipContainerVend,

      // Free‐form notes
      extraInfoBlock: descExtra
    }
  };
}
