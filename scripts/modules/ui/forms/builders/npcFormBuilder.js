// @file: /scripts/modules/ui/forms/builders/npcFormBuilder.js
// @version: 2.0 

import {
  createDescriptionField,
  createExtraInfoField
} from "../universalForm.js";

/** Convenience: make a label / input row (plus optional widget). */
function makeRow(label, input, widget = null) {
  const row = document.createElement("div");
  row.classList.add("field-row");

  const lbl = document.createElement("label");
  lbl.textContent = label;
  row.append(lbl, input);
  if (widget) row.append(widget);
  return row;
}

/** Builds the form and returns `{ form, fields }`. */
export function createNpcForm() {
  const form = document.createElement("form");
  form.id = "npc-form";

  /* ── simple inputs ───────────────────────────────────── */
  const fldName      = Object.assign(document.createElement("input"), { type: "text",   id: "fld-npc-name" });
  const fldHealth    = Object.assign(document.createElement("input"), { type: "number", id: "fld-npc-hp",   min: "0" });
  const fldDamage    = Object.assign(document.createElement("input"), { type: "number", id: "fld-npc-dmg",  min: "0" });
  const fldImgSmall  = Object.assign(document.createElement("input"), { type: "text",   id: "fld-npc-img-s" });
  const fldImgLarge  = Object.assign(document.createElement("input"), { type: "text",   id: "fld-npc-img-l" });

  /* ── color‑picker swatches (Pickr attaches later) ────── */
  const swName =  Object.assign(document.createElement("button"), { type: "button", className: "color-swatch", id: "swatch-name"  });
  const swHP   =  Object.assign(document.createElement("button"), { type: "button", className: "color-swatch", id: "swatch-hp"    });
  const swDMG  =  Object.assign(document.createElement("button"), { type: "button", className: "color-swatch", id: "swatch-dmg"   });
  const swDesc =  Object.assign(document.createElement("button"), { type: "button", className: "color-swatch", id: "swatch-desc"  });

  /* ── roles checkboxes ────────────────────────────────── */
  const ROLE_OPTS = ["Enemy", "Vendor", "QuestGiver"];
  const roleWrap  = document.createElement("div");
  roleWrap.style.display = "flex";
  roleWrap.style.gap     = "8px";

  const roleCheckboxes = ROLE_OPTS.map(r => {
    const cb  = Object.assign(document.createElement("input"), { type: "checkbox", value: r, id: `role-${r.toLowerCase()}` });
    const lab = Object.assign(document.createElement("label"), { htmlFor: cb.id, textContent: r });
    const cell = document.createElement("div");
    cell.append(cb, lab);
    roleWrap.appendChild(cell);
    return cb;
  });

  /* ── loot & vendor picker placeholders ───────────────── */
  const makePickerRow = (label, btnId, chipsId) => {
    const chips = Object.assign(document.createElement("div"), {
      id: chipsId,
      style: "flex:1;display:flex;flex-wrap:wrap;gap:4px"
    });
    const btn = Object.assign(document.createElement("button"), {
      type: "button",
      className: "ui-button",
      id: btnId,
      textContent: "⚙︎",
      title: "Edit " + label
    });
    return { row: makeRow(label, chips, btn), chips, btn };
  };

  const lootRow = makePickerRow("Loot Pool",   "btn-edit-loot", "chips-loot");
  const vendRow = makePickerRow("Vendor Stock","btn-edit-vend", "chips-vend");

  /* ── description & extra info ───────────────────────── */
  const { row: rowDesc, textarea: fldDesc } = createDescriptionField();
  rowDesc.appendChild(swDesc);

  const { row: rowExtras, extraInfo } = createExtraInfoField({ withDividers: true });

  /* ── assemble ───────────────────────────────────────── */
  form.append(
    makeRow("Name",   fldName, swName),
    (() => {
      const r = document.createElement("div");
      r.className = "field-row";
      const lbl = document.createElement("label");
      lbl.textContent = "Roles";
      r.append(lbl, roleWrap);
      return r;
    })(),
    makeRow("Health", fldHealth, swHP),
    makeRow("Damage", fldDamage, swDMG),
    lootRow.row,
    vendRow.row,
    rowDesc,
    rowExtras,
    makeRow("Image S", fldImgSmall),
    makeRow("Image L", fldImgLarge)
  );

  return {
    form,
    fields: {
      /* basic inputs */
      fldName, fldHealth, fldDamage, fldImgSmall, fldImgLarge,
      /* swatches */
      swName, swHP, swDMG, swDesc,
      /* roles */
      roleCheckboxes,
      /* inventories */
      lootChips: lootRow.chips,
      vendChips: vendRow.chips,
      btnLoot:   lootRow.btn,
      btnVend:   vendRow.btn,
      lootPool:  [],
      vendInv:   [],
      /* long text */
      fldDesc,
      extraInfo
    }
  };
}
