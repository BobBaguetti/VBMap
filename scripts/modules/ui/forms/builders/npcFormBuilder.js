// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 1.0 – fresh modular builder derived from chestFormBuilder (2025‑05‑05)

import {
  createDescriptionField,
  createExtraInfoField
} from "../universalForm.js";

import { createTopAlignedFieldRow } from "../../../utils/formUtils.js";

/**
 * Builds and returns the **NPC definition** form.
 * The returned object mirrors chestFormBuilder shape:
 *   - `form`   DOM <form>
 *   - `fields` map of input refs & helper arrays
 */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  // helper to build a simple labelled row
  const makeRow = (label, input) => {
    const row = document.createElement("div");
    row.classList.add("field-row");
    const lbl = document.createElement("label");
    lbl.textContent = label;
    row.append(lbl, input);
    return row;
  };

  /* ── basics ───────────────────────────────────────────── */
  const fldName = document.createElement("input");
  fldName.type = "text";
  fldName.id   = "fld-npc-name";
  const rowName = makeRow("Name", fldName);

  const fldIcon = document.createElement("input");
  fldIcon.type = "text";
  fldIcon.id   = "fld-npc-icon";
  const rowIcon = makeRow("Icon URL", fldIcon);

  const fldSub = document.createElement("input");
  fldSub.type = "text";
  fldSub.id   = "fld-npc-subtext";
  const rowSub = makeRow("Subtext", fldSub);

  /* ── roles ─────────────────────────────────────────────── */
  const rowRoles = document.createElement("div");
  rowRoles.classList.add("field-row");
  const lblRoles = document.createElement("label");
  lblRoles.textContent = "Roles";
  const rolesWrap = document.createElement("div");
  rolesWrap.style.display = "flex";
  rolesWrap.style.gap = "8px";
  const ROLE_OPTS = ["Enemy", "Vendor", "QuestGiver"];
  const roleCbs = ROLE_OPTS.map(r => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = r;
    cb.id = "fld-npc-role-" + r.toLowerCase();
    const lab = document.createElement("label");
    lab.htmlFor = cb.id;
    lab.textContent = r;
    const cell = document.createElement("div");
    cell.append(cb, lab);
    return cell;
  });
  roleCbs.forEach(c => rolesWrap.appendChild(c));
  rowRoles.append(lblRoles, rolesWrap);

  /* ── stats ─────────────────────────────────────────────── */
  const fldHP = document.createElement("input");
  fldHP.type = "number";
  fldHP.min  = "0";
  fldHP.id   = "fld-npc-hp";
  const rowHP = makeRow("Health", fldHP);

  const fldDMG = document.createElement("input");
  fldDMG.type = "number";
  fldDMG.min  = "0";
  fldDMG.id   = "fld-npc-dmg";
  const rowDMG = makeRow("Damage", fldDMG);

  /* ── loot/vendor pickers ───────────────────────────────── */
  const makePickerRow = (label, btnId, chipsId) => {
    const row = document.createElement("div");
    row.classList.add("field-row");
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const chips = document.createElement("div");
    chips.id = chipsId;
    Object.assign(chips.style, {
      flex: "1",
      display: "flex",
      flexWrap: "wrap",
      gap: "4px"
    });
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ui-button";
    btn.textContent = "⚙︎";
    btn.id = btnId;
    btn.title = "Edit " + label;
    row.append(lbl, chips, btn);
    return { row, chips, btn };
  };

  const lootRow   = makePickerRow("Loot Pool",   "btn-npc-loot-edit", "chips-npc-loot");
  const vendRow   = makePickerRow("Vendor Stock","btn-npc-vend-edit", "chips-npc-vend");

  /* ── description & extra info ──────────────────────────── */
  const {
    row:       rowDesc,
    textarea:  fldDesc,
    colorBtn:  colorDesc
  } = createDescriptionField();
  colorDesc.id = "fld-npc-desc-color";
  colorDesc.classList.add("color-swatch");

  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  /* ── assemble ──────────────────────────────────────────── */
  form.append(
    rowName,
    rowRoles,
    rowHP,
    rowDMG,
    rowIcon,
    rowSub,
    lootRow.row,
    vendRow.row,
    rowDesc,
    rowExtras
  );

  return {
    form,
    fields: {
      fldName,
      fldIcon,
      fldSubtext: fldSub,

      roleCheckboxes: roleCbs.map(c => c.querySelector("input")),
      fldHP,
      fldDMG,

      lootPool:       [],
      vendInventory:  [],
      chipContainerLoot: lootRow.chips,
      chipContainerVend: vendRow.chips,
      btnEditLoot:    lootRow.btn,
      btnEditVend:    vendRow.btn,

      fldDesc,
      colorDesc,
      extraInfo,
      rowExtras
    }
  };
}
