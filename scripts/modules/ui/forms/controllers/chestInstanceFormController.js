// @file: /scripts/modules/ui/forms/controllers/chestInstanceFormController.js
// @version: 1.1 – standardize header + floating buttons

import { loadChestTypes } from "../../../services/chestTypesService.js";
import { createChestInstanceForm } from "../builders/chestInstanceFormBuilder.js";

/**
 * Controller for the “Add Chest” form.
 * @param {{onCancel():void, onSubmit(payload):Promise}} callbacks
 * @param {import('firebase/firestore').Firestore} db
 * @param {[number,number]} coords
 */
export async function createChestInstanceFormController(
  { onCancel, onSubmit },
  db,
  coords
) {
  const { form, fields } = createChestInstanceForm();
  let _coords = coords;

  // ─── Header + Buttons ──────────────────────────────────────────────
  const headerWrap = document.createElement("div");
  headerWrap.style.display = "flex";
  headerWrap.style.justifyContent = "space-between";
  headerWrap.style.alignItems = "center";

  const titleEl = document.createElement("h3");
  titleEl.textContent = "Place Chest";
  headerWrap.appendChild(titleEl);

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
  headerWrap.appendChild(btnRow);

  form.prepend(headerWrap);

  // ─── Populate types dropdown ───────────────────────────────────────
  const types = await loadChestTypes(db);
  fields.fldType.innerHTML = "";
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    fields.fldType.appendChild(opt);
  });

  // ─── Handle submit ───────────────────────────────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit({
      chestTypeId: fields.fldType.value,
      coords: _coords
    });
  });

  return { form };
}
