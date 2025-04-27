// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.1 – loot-pool chip container & picker button

/**
 * Builds the form layout for creating/editing a Chest Type.
 * Includes:
 *  • Name
 *  • Icon URL
 *  • Loot Pool (chips + picker button)
 *  • Max Display
 */
export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // — Name —
  const rowName = document.createElement("div");
  rowName.classList.add("field-row");
  const lblName = document.createElement("label");
  lblName.htmlFor = "fld-chest-name";
  lblName.textContent = "Name";
  const fldName = document.createElement("input");
  fldName.type = "text";
  fldName.id   = "fld-chest-name";
  rowName.append(lblName, fldName);

  // — Icon URL —
  const rowIcon = document.createElement("div");
  rowIcon.classList.add("field-row");
  const lblIcon = document.createElement("label");
  lblIcon.htmlFor = "fld-chest-icon";
  lblIcon.textContent = "Icon URL";
  const fldIcon = document.createElement("input");
  fldIcon.type = "text";
  fldIcon.id   = "fld-chest-icon";
  rowIcon.append(lblIcon, fldIcon);

  // — Loot Pool —
  // label + chips container + cog button
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  // chips container
  const chipContainer = document.createElement("div");
  chipContainer.classList.add("loot-pool-chips");
  chipContainer.id = "fld-chest-loot-chips";
  chipContainer.style.flex = "1";       // fill remaining space
  chipContainer.style.display = "flex";
  chipContainer.style.flexWrap = "wrap";
  chipContainer.style.gap = "4px";
  // picker button (⚙︎)
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button";
  openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainer, openLootPicker);

  // — Max Display —
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

  return {
    form,
    fields: {
      fldName,
      fldIconUrl: fldIcon,
      // internal array of IDs
      lootPool: [],
      // elements for the picker
      openLootPicker,
      chipContainer,
      fldMaxDisplay: fldMax
    }
  };
}
