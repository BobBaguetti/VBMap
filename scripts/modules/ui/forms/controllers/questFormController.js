// @version: 3 
// @file: /scripts/modules/ui/forms/controllers/questFormController.js

import { createQuestForm }   from "../builders/questFormBuilder.js";
import { createIcon }        from "../../../utils/iconUtils.js";
// ← fixed path: up two to ui then pickrManager.js
import { getPickrHexColor }  from "../../pickrManager.js";

/**
 * Controller for the Quest form.
 * Handles Add/Edit state, reset, populate, and data harvesting.
 */
export function createQuestFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields, rows } = createQuestForm();
  let _id = null;

  // ─── Header + Action Buttons ────────────────────────────────────────
  const headerWrap = document.createElement("div");
  Object.assign(headerWrap.style, {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center"
  });

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
  btnClear.onclick = () => {
    reset();
    onCancel?.();
  };

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this Quest";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id) onDelete?.(_id);
  };

  btnRow.append(btnSave, btnClear, btnDelete);
  headerWrap.appendChild(btnRow);
  form.prepend(headerWrap);

  // ─── Reset to Add Mode ──────────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add Quest";
    btnDelete.style.display = "none";
    fields.objectives.setLines([], false);
    fields.rewards.setLines([], false);
  }

  // ─── Populate for Edit Mode ─────────────────────────────────────────
  function populate(def = {}) {
    _id = def.id || null;
    titleEl.textContent = _id ? "Edit Quest" : "Add Quest";
    btnDelete.style.display = _id ? "" : "none";

    fields.fldName.value = def.name || "";
    fields.fldDesc.value = def.description || "";
    fields.objectives.setLines(def.objectives || [], false);
    fields.rewards.setLines(def.rewards || [], false);
  }

  // ─── Gather data for submission ─────────────────────────────────────
  function getCustom() {
    return {
      id:           _id,
      name:         fields.fldName.value.trim(),
      nameColor:    getPickrHexColor(fields.colorName._pickr),
      description:  fields.fldDesc.value.trim(),
      descColor:    getPickrHexColor(fields.colorDesc._pickr),
      objectives:   fields.objectives.getLines(),
      rewards:      fields.rewards.getLines()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = getCustom();
    await onSubmit?.(payload);
    reset();
  });

  return { form, reset, populate, getCustom };
}
