// @version: 3.2 — description + Extra Info block (no “Notes” label)
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js

import { createTextField }         from "../../uiKit.js";
import { createDescriptionField }  from "../universalForm.js";
import { createExtraInfoField }    from "../universalForm.js";
import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPool + openLootPicker + chipContainerLoot,
 *   vendorInv + openVendorPicker + chipContainerVend,
 *   fldDesc + colorDesc,
 *   extraInfoBlock (the "Extra Info" rows under description)
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
    cb.type  = "checkbox";
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

  // — Loot Pool (chips + gear) —
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool:";
  const chipContainerLoot = document.createElement("div");
  chipContainerLoot.classList.add("loot-pool-chips");
  Object.assign(chipContainerLoot.style, {
    flex: "1", display: "flex", flexWrap: "wrap", gap: "4px"
  });
  const openLootPicker = document.createElement("button");
  openLootPicker.type        = "button";
  openLootPicker.className   = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title       = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainerLoot, openLootPicker);

  // — Vendor Inventory (chips + gear) —
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
  openVendorPicker.type        = "button";
  openVendorPicker.className   = "ui-button";
  openVendorPicker.textContent = "⚙︎";
  openVendorPicker.title       = "Edit Vendor Inventory";
  rowVend.append(lblVend, chipContainerVend, openVendorPicker);

  // — Description (textarea + color swatch) —
  const {
    row:      rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createDescriptionField();
  colorDesc.id = "npc-fld-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Extra Info (only place with dynamic rows) —
  const extraInfoField = createExtraInfoField({ withDividers: true });
  // extraInfoField.row already has the "Extra Info:" label + "+" button

  // Assemble in order
  form.append(
    rowName,
    rowTypes,
    rowHealth,
    rowDamage,
    rowLoot,
    rowVend,
    rowDesc,
    extraInfoField.row
  );

  return {
    form,
    fields: {
      fldName,
      fldTypeFlags,
      fldHealth,
      fldDamage,

      // Loot‐pool
      lootPool:           [],              // selected IDs
      openLootPicker,                      // ⚙︎ button
      chipContainerLoot,                   // shows item chips

      // Vendor inventory
      vendorInv:          [],              // selected IDs
      openVendorPicker,                    // ⚙︎ button
      chipContainerVend,                   // shows item chips

      // Description
      fldDesc,
      colorDesc,

      // Extra Info under description
      extraInfoBlock:     extraInfoField.extraInfo
    }
  };
}
