// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 1.2 – adds dynamic loot-pool loading and proper reset/populate

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";

/**
 * Controller to manage the Chest Type form.
 * @param {{ onCancel():void, onSubmit(payload):Promise, onDelete(id):Promise }} callbacks
 * @param {import('firebase/firestore').Firestore} db
 */
export function createChestFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createChestForm();
  let _id = null;

  // Header + Buttons
  const headerWrap = document.createElement("div");
  headerWrap.style.display = "flex";
  headerWrap.style.justifyContent = "space-between";
  headerWrap.style.alignItems = "center";

  const titleEl = document.createElement("h3");
  titleEl.textContent = "Add Chest Type";
  headerWrap.appendChild(titleEl);

  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";
  btnRow.appendChild(btnSave);

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick = onCancel;
  btnRow.appendChild(btnCancel);

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.textContent = "Delete";
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id != null && confirm(`Delete this chest type?`)) {
      onDelete(_id);
    }
  };
  btnRow.appendChild(btnDelete);

  headerWrap.appendChild(btnRow);
  form.prepend(headerWrap);

  // ─── Load and populate loot-pool options ─────────────────────────
  async function initLootOptions(selected = []) {
    const items = await loadItemDefinitions(db);
    fields.fldLootPool.innerHTML = "";
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      opt.selected = selected.includes(item.id);
      fields.fldLootPool.appendChild(opt);
    });
  }
  initLootOptions([]);

  // ─── Reset to “Add” mode ────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add Chest Type";
    btnDelete.style.display = "none";
    initLootOptions([]);
  }

  // ─── Populate for “Edit” mode ──────────────────────────────────
  function populate(def) {
    form.reset();
    _id = def.id;
    titleEl.textContent = "Edit Chest Type";
    btnDelete.style.display = "";
    fields.fldName.value       = def.name || "";
    fields.fldMaxDisplay.value = def.maxDisplay || "";
    fields.fldIconUrl.value    = def.iconUrl || "";
    initLootOptions(def.lootPool || []);
  }

  // ─── Gather form data ─────────────────────────────────────────
  function getCustom() {
    return {
      id:          _id,
      name:        fields.fldName.value.trim(),
      iconUrl:     fields.fldIconUrl.value.trim(),
      maxDisplay:  parseInt(fields.fldMaxDisplay.value, 10) || 1,
      lootPool:    Array.from(fields.fldLootPool.selectedOptions)
                        .map(o => o.value)
    };
  }

  // ─── Form submit handler ───────────────────────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit(getCustom());
  });

  return { form, reset, populate, getCustom };
}
