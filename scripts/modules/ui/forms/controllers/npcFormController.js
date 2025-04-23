// NPC form controller file
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 1

import { createNpcForm } from "../builders/npcFormBuilder.js";

export function createNpcFormController({ onSubmit, onCancel, onDelete }) {
  const form = createNpcForm();
  
  // Add buttons to the top-right of the form header
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.textContent = "Add NPC";
  subheadingWrap.appendChild(subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this NPC";
  btnDelete.style.width = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick = () => { if (_id) onDelete?.(_id); };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  form.prepend(subheadingWrap);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) {
      const payload = getCustom();
      await onSubmit(payload);
    }
  });

  function reset() {
    form.reset();
    _id = null;
    subheading.textContent = "Add NPC";
  }

  function populate(def) {
    // Populate NPC data into the form
    _id = def.id || null;
    subheading.textContent = "Edit NPC";
  }

  function getCustom() {
    // Get NPC data from the form fields
    return {
      id: _id,
      name: form.elements.name.value.trim(),
      // Add other form fields here
    };
  }

  let _id = null;

  return {
    form,
    reset,
    populate,
    getCustom
  };
}
