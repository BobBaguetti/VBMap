// @file: /scripts/modules/ui/forms/controllers/chestInstanceFormController.js
// @version: 1.0

import { loadChestTypes } from "../../../services/chestTypesService.js";
import { createChestInstanceForm } from "../builders/chestInstanceFormBuilder.js";

/**
 * Controller for the “Add Chest” form.
 * @param {{onCancel():void, onSubmit(payload):Promise}} callbacks
 * @param {import('firebase/firestore').Firestore} db
 * @param {[number,number]} coords
 */
export async function createChestInstanceFormController({ onCancel, onSubmit }, db, coords) {
  const { form, fields } = createChestInstanceForm();
  let _coords = coords;

  // Header + buttons
  const hdr = document.createElement("div");
  hdr.style.display = "flex";
  hdr.style.justifyContent = "space-between";
  hdr.style.alignItems = "center";
  const title = document.createElement("h3");
  title.textContent = "Place Chest";
  hdr.appendChild(title);

  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";
  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";
  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick = onCancel;
  btnRow.append(btnSave, btnCancel);
  hdr.appendChild(btnRow);
  form.prepend(hdr);

  // Populate types dropdown
  async function initTypes() {
    const types = await loadChestTypes(db);
    fields.fldType.innerHTML = "";
    types.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      fields.fldType.appendChild(opt);
    });
  }
  await initTypes();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      chestTypeId: fields.fldType.value,
      coords: _coords
    };
    await onSubmit(payload);
  });

  return { form };
}
