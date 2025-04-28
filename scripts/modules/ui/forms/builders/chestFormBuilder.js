// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.2 – removed obsolete Max Display field

/**
 * Builds the form layout for creating/editing a Chest Type.
 * Includes:
 *  • Name
 *  • Icon URL
 *  • Loot Pool (chips + picker button)
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
  const rowLoot = document.createElement("div");
  rowLoot.classList.add("field-row");
  const lblLoot = document.createElement("label");
  lblLoot.textContent = "Loot Pool";
  // chips container
  const chipContainer = document.createElement("div");
  chipContainer.classList.add("loot-pool-chips");
  chipContainer.id = "fld-chest-loot-chips";
  Object.assign(chipContainer.style, {
    flex:       "1",
    display:    "flex",
    flexWrap:   "wrap",
    gap:        "4px"
  });
  // picker button (⚙︎)
  const openLootPicker = document.createElement("button");
  openLootPicker.type = "button";
  openLootPicker.className = "ui-button";
  openLootPicker.textContent = "⚙︎";
  openLootPicker.title = "Edit Loot Pool";
  rowLoot.append(lblLoot, chipContainer, openLootPicker);

  // Assemble form
  form.append(rowName, rowIcon, rowLoot);

  return {
    form,
    fields: {
      fldName,
      fldIconUrl:       fldIcon,
      lootPool:         [],
      openLootPicker,
      chipContainer
    }
  };
}
