// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.2 – styled field‐rows without universalForm

/**
 * Builds the form layout for creating/editing a Chest Type.
 */
export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // Name
  const rowName = document.createElement("div");
  rowName.classList.add("field-row");
  const lblName = document.createElement("label");
  lblName.htmlFor = "fld-chest-name";
  lblName.textContent = "Name";
  const fldName = document.createElement("input");
  fldName.type = "text";
  fldName.id   = "fld-chest-name";
  rowName.append(lblName, fldName);

  // Icon URL
  const rowIcon = document.createElement("div");
  rowIcon.classList.add("field-row");
  const lblIcon = document.createElement("label");
  lblIcon.htmlFor = "fld-chest-icon";
  lblIcon.textContent = "Icon URL";
  const fldIcon = document.createElement("input");
  fldIcon.type = "text";
  fldIcon.id   = "fld-chest-icon";
  rowIcon.append(lblIcon, fldIcon);

  // Loot Pool (multi-select)
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.htmlFor = "fld-chest-loot";
  lblLoot.textContent = "Loot Pool";
  const fldLoot = document.createElement("select");
  fldLoot.id       = "fld-chest-loot";
  fldLoot.multiple = true;
  fldLoot.style.minHeight = "80px";  // so you can see multiple options
  rowLoot.append(lblLoot, fldLoot);

  // Max Display
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

  form.append(rowName, rowIcon, rowLoot, rowMax);

  return {
    form,
    fields: {
      fldName,
      fldIconUrl: fldIcon,
      fldLootPool: fldLoot,
      fldMaxDisplay: fldMax
    }
  };
}
