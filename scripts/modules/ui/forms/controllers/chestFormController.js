// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 1.1

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";

/**
 * Controller to manage the Chest Type form.
 * @param {object} callbacks
 *   - onCancel()
 *   - onSubmit(payload)
 *   - onDelete(id)
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

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type      = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.textContent = "Delete";
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id != null && confirm(`Delete this chest type?`)) {
      onDelete(_id);
    }
  };

  btnRow.append(btnSave, btnClear, btnDelete);
  headerWrap.appendChild(btnRow);
  form.prepend(headerWrap);

  // ─── Populate loot‐pool options ──────────────────────────────────
  async function initLootOptions() {
    // Use the passed-in Firestore instance
    const items = await loadItemDefinitions(db);
    fields.fldLootPool.innerHTML = "";
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      fields.fldLootPool.append(opt);
    });
  }
  initLootOptions();

  // ─── Reset to “Add” mode ────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add Chest Type";
    btnDelete.style.display = "none";
  }

  // ─── Populate for “Edit” mode ──────────────────────────────────
  function populate(def) {
    form.reset();
    fields.fldName.value       = def.name || "";
    fields.fldIconUrl.value    = def.iconUrl || "";
    fields.fldMaxDisplay.value = def.maxDisplay || "";
    Array.from(fields.fldLootPool.options).forEach(opt => {
      opt.selected = def.lootPool?.includes(opt.value);
    });
    _id = def.id;
    titleEl.textContent = "Edit Chest Type";
    btnDelete.style.display = "";
  }

  // ─── Gather payload ────────────────────────────────────────────
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

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit(getCustom());
  });

  return {
    form,
    reset,
    populate,
    getCustom
  };
}
