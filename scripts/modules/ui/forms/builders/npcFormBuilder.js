// @version: 3.2 – re-expose chipContainerLoot/Vend for controller reset
// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js

import { createTextField }           from "../../uiKit.js";
import { createDescriptionField, createExtraInfoField } from "../universalForm.js";
import { createTopAlignedFieldRow }  from "../../../utils/formUtils.js";

/**
 * Build the DOM form for NPC definitions, including:
 * - Name, Roles, Health, Damage
 * - Loot Pool & Vendor Inventory pickers
 * - Description + color
 * - Image S/L URLs
 * - Extra Info list
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // — Name —
  const { row: rowName, input: fldName } =
    createTextField("Name:", "npc-fld-name");

  // — Roles —
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
  fldHealth.type = "number"; fldHealth.min = "0";

  const { row: rowDamage, input: fldDamage } =
    createTextField("Damage:", "npc-fld-damage");
  fldDamage.type = "number"; fldDamage.min = "0";

  // — Loot Pool (chips + picker) —
  const chipContainerLoot = document.createElement("div");
  chipContainerLoot.className = "loot-pool-chips";
  Object.assign(chipContainerLoot.style, {
    flex: "1", display: "flex", flexWrap: "wrap", gap: "4px"
  });
  const btnLoot = document.createElement("button");
  btnLoot.type = "button";
  btnLoot.className = "ui-button";
  btnLoot.textContent = "⚙︎";
  btnLoot.title = "Edit Loot Pool";
  const rowLoot = createTopAlignedFieldRow("Loot Pool:", chipContainerLoot);
  rowLoot.append(btnLoot);

  // — Vendor Inventory (chips + picker) —
  const chipContainerVend = document.createElement("div");
  chipContainerVend.className = "loot-pool-chips";
  Object.assign(chipContainerVend.style, {
    flex: "1", display: "flex", flexWrap: "wrap", gap: "4px"
  });
  const btnVend = document.createElement("button");
  btnVend.type = "button";
  btnVend.className = "ui-button";
  btnVend.textContent = "⚙︎";
  btnVend.title = "Edit Vendor Inventory";
  const rowVend = createTopAlignedFieldRow("Vendor Inventory:", chipContainerVend);
  rowVend.append(btnVend);

  // — Description (textarea + swatch) —
  const {
    row:      rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createDescriptionField();
  colorDesc.id = "npc-fld-desc-color";
  colorDesc.classList.add("color-swatch");

  // — Image URLs —
  const { row: rowImgS, input: fldImgS } =
    createTextField("Image S:", "npc-fld-imgs");
  const { row: rowImgL, input: fldImgL } =
    createTextField("Image L:", "npc-fld-imgl");

  // — Extra Info (text + color swatches) —
  const {
    row:       rowExtra,
    extraInfo: extraField
  } = createExtraInfoField({ withDividers: false });

  // assemble form
  form.append(
    rowName,
    rowTypes,
    rowHealth,
    rowDamage,
    rowLoot,
    rowVend,
    document.createElement("hr"),
    rowDesc,
    rowImgS,
    rowImgL,
    rowExtra
  );

  return {
    form,
    fields: {
      fldName,
      fldTypeFlags,
      fldHealth,
      fldDamage,

      // Loot pool state and container
      lootPool:           [],               // selected IDs
      chipContainerLoot,                    // DOM container for chips
      openLootPicker:     btnLoot,          // picker trigger

      // Vendor inventory state and container
      vendorInv:          [],               // selected IDs
      chipContainerVend,                    // DOM container for chips
      openVendorPicker:   btnVend,          // picker trigger

      // Description
      fldDesc,
      colorDesc,

      // Images
      fldImgS,
      fldImgL,

      // Extra info
      extra:              extraField        // API: getValues(), clear(), setValues()
    }
  };
}
