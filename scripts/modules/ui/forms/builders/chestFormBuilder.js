// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.3 – loot-pool chips + picker button

/**
 * Builds the form layout for creating/editing a Chest Type.
 */
export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // ─── Name ─────────────────────────────────────────────────────────
  const rowName = document.createElement("div");
  rowName.classList.add("field-row");
  const lblName = document.createElement("label");
  lblName.htmlFor = "fld-chest-name";
  lblName.textContent = "Name";
  const fldName = document.createElement("input");
  fldName.type = "text";
  fldName.id   = "fld-chest-name";
  rowName.append(lblName, fldName);

  // ─── Icon URL ────────────────────────────────────────────────────
  const rowIcon = document.createElement("div");
  rowIcon.classList.add("field-row");
  const lblIcon = document.createElement("label");
  lblIcon.htmlFor = "fld-chest-icon";
  lblIcon.textContent = "Icon URL";
  const fldIcon = document.createElement("input");
  fldIcon.type = "text";
  fldIcon.id   = "fld-chest-icon";
  rowIcon.append(lblIcon, fldIcon);

  // ─── Loot Pool ────────────────────────────────────────────────────
  // We'll render chosen items as “chips” here and open a picker on ⚙️
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.htmlFor = "fld-chest-loot-chips";
  lblLoot.textContent = "Loot Pool";
  // chip container
  const chipContainer = document.createElement("div");
  chipContainer.id = "fld-chest-loot-chips";
  chipContainer.classList.add("loot-pool-chips");
  // picker button (⚙️)
  const btnPicker = document.createElement("button");
  btnPicker.type = "button";
  btnPicker.classList.add("ui-button", "loot-pool-picker-btn");
  btnPicker.title = "Manage Loot Pool";
  btnPicker.textContent = "⚙️";
  rowLoot.append(lblLoot, chipContainer, btnPicker);

  // ─── Max Display ────────────────────────────────────────────────
  const rowMax = document.createElement("div");
  rowMax.classList.add("field-row");
  const lblMax = document.createElement("label");
  lblMax.htmlFor = "fld-chest-max";
  lblMax.textContent = "Max Display";
  const fldMax = document.createElement("input");
  fldMax.type = "number";
  fldMax.id   = "fld-chest-max";
  fldMax.min  = "1";
  rowMax.append(lblMax, fldMax);

  // assemble
  form.append(rowName, rowIcon, rowLoot, rowMax);

  // internally track selected IDs
  const lootPool = [];

  return {
    form,
    fields: {
      fldName,
      fldIconUrl:     fldIcon,
      fldMaxDisplay:  fldMax,
      lootPool,               // array of selected item-IDs
      chipContainer,          // where to render “chips”
      openLootPicker: btnPicker
    }
  };
}
