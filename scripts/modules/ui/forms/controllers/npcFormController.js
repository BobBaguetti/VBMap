// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 1.1

import { createNpcForm } from "../builders/npcFormBuilder.js";
import { createPickr } from "../../pickrManager.js";
import { getPickrHexColor } from "../../../utils/colorUtils.js";
import { createIcon } from "../../../utils/iconUtils.js";

/**
 * Controller for the NPC definition form.
 */
export function createNpcFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields, subheadingWrap, subheading } = createNpcForm();
  const pickrs = {};
  let _id = null;

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
  btnClear.onclick = () => {
    reset();
    onCancel?.();
  };

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this NPC";
  btnDelete.style.width = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick = () => {
    if (_id && confirm("Delete this NPC?")) onDelete?.(_id);
  };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  form.prepend(subheadingWrap);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const payload = getCustom();
    payload.id = _id;
    onSubmit?.(payload);
  });

  function initPickrs() {
    requestAnimationFrame(() => {
      ["colorName", "colorDesc"].forEach(key => {
        const btn = fields[key];
        const el = document.getElementById(btn?.id);
        if (btn && btn.id && el && document.body.contains(el)) {
          pickrs[key] = createPickr(`#${btn.id}`);
        } else {
          console.warn(`⚠️ Skipping Pickr init: #${btn?.id} not attached to DOM`);
        }
      });
    });
  }

  function reset() {
    fields.fldName.value = "";
    fields.fldDesc.value = "";
    fields.extraInfo.setLines([]);
    _id = null;
    subheading.textContent = "Add NPC";
  }

  function populate(def) {
    fields.fldName.value = def.name || "";
    fields.fldDesc.value = def.description || "";
    fields.extraInfo.setLines(def.extraInfo || []);
    _id = def.id || null;
    subheading.textContent = _id ? "Edit NPC" : "Add NPC";
  }

  function getCustom() {
    return {
      id: _id,
      name: fields.fldName.value.trim(),
      nameColor: getPickrHexColor(pickrs.colorName),
      description: fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.colorDesc),
      extraInfo: fields.extraInfo.getLines()
    };
  }

  return {
    form,
    reset,
    populate,
    getCustom,
    initPickrs,
    buttonRow,
    subheadingWrap
  };
}
