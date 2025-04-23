// @file: /scripts/modules/ui/forms/controllers/questFormController.js
// @version: 2

import { createQuestForm } from "../builders/questFormBuilder.js";
import { createIcon } from "../../../utils/iconUtils.js";

/**
 * Creates a controller around a form layout for quest definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createQuestFormController({ onCancel, onSubmit, onDelete }) {
  const form = createQuestForm();
  // Build header + buttons
  const headerWrap = document.createElement("div");
  headerWrap.style.display = "flex";
  headerWrap.style.justifyContent = "space-between";
  headerWrap.style.alignItems = "center";

  const titleEl = document.createElement("h3");
  titleEl.textContent = "Add Quest";
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
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this quest";
  btnDelete.appendChild(createIcon("trash", { inline: true }));
  btnDelete.style.display = "none"; // hidden in Add mode
  btnDelete.onclick = () => { if (_id) onDelete?.(_id); };

  btnRow.append(btnSave, btnClear, btnDelete);
  headerWrap.appendChild(btnRow);
  form.prepend(headerWrap);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) {
      const payload = getCustom();
      await onSubmit(payload);
    }
  });

  let _id = null;
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add Quest";
    btnDelete.style.display = "none";
  }
  function populate(def) {
    _id = def.id;
    titleEl.textContent = "Edit Quest";
    btnDelete.style.display = "";
    // populate other fields...
  }
  function getCustom() {
    return {
      id: _id,
      name: form.elements.name.value.trim(),
      description: form.elements.description.value.trim(),
      reward: form.elements.reward.value.trim()
    };
  }

  return { form, reset, populate, getCustom };
}
