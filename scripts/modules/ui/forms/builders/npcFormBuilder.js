// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 2.4 — single Description field with color picker

import { createTextField }           from "../../uiKit.js";
import { createDescriptionField }    from "../universalForm.js";
import { createExtraInfoField }      from "../universalForm.js";
import { createTopAlignedFieldRow }  from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions.
 * Returns { form, fields } where fields contains:
 *   fldName, fldTypeFlags[], fldHealth, fldDamage,
 *   lootPoolBlock, vendorInvBlock, descField
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

  // — Loot Pool —
  const lootExtra = createExtraInfoField({ withDividers: true });
  const openLootPicker = document.createElement("button");
  openLootPicker.type        = "button";
  openLootPicker.className   = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title       = "Edit Loot Pool";
  lootExtra.row.append(openLootPicker);
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", lootExtra.row);

  // — Vendor Inventory —
  const vendExtra = createExtraInfoField({ withDividers: true });
  const openVendorPicker = document.createElement("button");
  openVendorPicker.type        = "button";
  openVendorPicker.className   = "ui-button";
  openVendorPicker.textContent = "⚙︎";
  openVendorPicker.title       = "Edit Vendor Inventory";
  vendExtra.row.append(openVendorPicker);
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", vendExtra.row);

  // — Description —
  const {
    row:      rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createDescriptionField();
  colorDesc.id = "npc-fld-desc-color";
  colorDesc.classList.add("color-swatch");

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

      // Loot-pool
      lootPool:          [],                    // selected item IDs
      openLootPicker,                             // button to open picker
      lootPoolBlock:     lootExtra.extraInfo,    // has .block, .getLines(), .setLines()

      // Vendor inventory
      vendorInv:         [],                    // selected item IDs
      openVendorPicker,                           // button to open picker
      vendorInvBlock:    vendExtra.extraInfo,    // same API

      // Single description field
      fldDesc,            // <textarea>
      colorDesc          // swatch btn
    }
  };
}
