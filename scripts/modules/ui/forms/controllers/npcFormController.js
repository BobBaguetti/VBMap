// @version: 3
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js 

import { createNpcForm }     from "../builders/npcFormBuilder.js";
import { createIcon }        from "../../../utils/iconUtils.js";
// ← fixed path: up two to ui then pickrManager.js
import { getPickrHexColor }  from "../../pickrManager.js"; 

/**
 * Creates a controller around a form layout for NPC definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createNpcFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;

  const headerWrap = document.createElement("div");
  Object.assign(headerWrap.style, {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center"
  });

  const titleEl = document.createElement("h3");
  titleEl.textContent = "Add NPC";
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
  btnClear.onclick = () => { reset(); onCancel?.(); };

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this NPC";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none";
  btnDelete.onclick = () => { if (_id) onDelete?.(_id); };

  btnRow.append(btnSave, btnClear, btnDelete);
  headerWrap.appendChild(btnRow);
  form.prepend(headerWrap);

  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add NPC";
    btnDelete.style.display = "none";
  }

  function populate(def = {}) {
    _id = def.id || null;
    titleEl.textContent = _id ? "Edit NPC" : "Add NPC";
    btnDelete.style.display = _id ? "" : "none";

    fields.fldName.value = def.name || "";
    fields.fldType.value = def.type || "";
    fields.fldHp.value   = def.hp   || "";
  }

  function getCustom() {
    return {
      id:         _id,
      name:       fields.fldName.value.trim(),
      nameColor:  getPickrHexColor(fields.colorName._pickr),
      type:       fields.fldType.value,
      typeColor:  getPickrHexColor(fields.colorType._pickr),
      hp:         fields.fldHp.value.trim(),
      hpColor:    getPickrHexColor(fields.colorHp._pickr)
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
