// @version: 1.1
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";

/**
 * Controller for the NPC definition form.
 * @param {{ onCancel: ()=>void, onSubmit: (def)=>Promise, onDelete: (id)=>Promise }} handlers
 */
export function createNpcFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;
  
  // Header & Buttons
  const header = document.createElement("div");
  header.className = "floating-header";
  const titleEl = document.createElement("h3");
  titleEl.textContent = "Add NPC";
  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";
  
  const btnSave = document.createElement("button");
  btnSave.type = "submit"; btnSave.className = "ui-button"; btnSave.textContent = "Save";
  
  const btnClear = document.createElement("button");
  btnClear.type = "button"; btnClear.className = "ui-button"; btnClear.textContent = "Clear";
  btnClear.onclick = () => { reset(); onCancel?.(); };
  
  const btnDelete = document.createElement("button");
  btnDelete.type = "button"; btnDelete.className = "ui-button-delete";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id) onDelete?.(_id).then(reset);
  };
  
  btnRow.append(btnSave, btnClear, btnDelete);
  header.append(titleEl, btnRow);
  form.prepend(header);
  
  // Reset to empty state
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add NPC";
    btnDelete.style.display = "none";

    // guard against missing blocks
    if (fields.lootPoolBlock?.extraInfo) {
      fields.lootPoolBlock.extraInfo.setLines([], false);
    }
    if (fields.vendorInvBlock?.extraInfo) {
      fields.vendorInvBlock.extraInfo.setLines([], false);
    }
    if (fields.extraInfoBlock?.extraInfo) {
      fields.extraInfoBlock.extraInfo.setLines([], false);
    }

    // clear checkboxes
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }
  
  // Populate form for edit
  function populate(def = {}) {
    _id = def.id || null;
    titleEl.textContent = _id ? "Edit NPC" : "Add NPC";
    btnDelete.style.display = _id ? "" : "none";
    
    fields.fldName.value    = def.name       || "";
    fields.fldHealth.value  = def.health     ?? "";
    fields.fldDamage.value  = def.damage     ?? "";
    
    // roles
    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags)
        ? def.typeFlags.includes(cb.value)
        : false;
    });
    
    // guard & populate extra‐info blocks
    if (fields.lootPoolBlock?.extraInfo) {
      fields.lootPoolBlock.extraInfo.setLines(def.lootPool || [], false);
    }
    if (fields.vendorInvBlock?.extraInfo) {
      fields.vendorInvBlock.extraInfo.setLines(def.vendorInventory || [], false);
    }
    if (fields.extraInfoBlock?.extraInfo) {
      fields.extraInfoBlock.extraInfo.setLines(def.extraLines || [], false);
    }
  }
  
  // Harvest form values
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      typeFlags:        fields.fldTypeFlags.filter(cb=>cb.checked).map(cb=>cb.value),
      health:           Number(fields.fldHealth.value) || 0,
      damage:           Number(fields.fldDamage.value) || 0,
      lootPool:         fields.lootPoolBlock?.extraInfo.getLines() || [],
      vendorInventory:  fields.vendorInvBlock?.extraInfo.getLines() || [],
      extraLines:       fields.extraInfoBlock?.extraInfo.getLines() || []
    };
  }
  
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const def = getCustom();
    await onSubmit?.(def);
    reset();
  });
  
  return { form, reset, populate };
}
