// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 1.3 – wire up new CSS classes

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createChestFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createChestForm();
  let _id = null;

  //
  // ─── INIT FORM UI ──────────────────────────────────────────────────────────────
  //
  // augment the builder’s fields with our chip container & cog button
  const chipWrapper = document.createElement("div");
  chipWrapper.classList.add("loot-pool-wrapper");
  fields.openLootPicker.classList.add("loot-pool-cog");
  // assume your builder put openLootPicker after the label; insert the wrapper before it:
  fields.openLootPicker.before(chipWrapper);
  fields.chipContainer = chipWrapper;

  // keep a plain array of selected IDs
  fields.lootPool = [];

  //
  // ─── PICKER MODAL ──────────────────────────────────────────────────────────────
  //
  let pickerModal, pickerContent, pickerHeader;
  let pickerList, pickerSearch, pickerSave, pickerCancel;
  let allItems = [];

  async function ensurePicker() {
    if (pickerModal) return;
    // 1) build the modal shell
    const created = createModal({
      id:         "chest-loot-picker",
      title:      "Select Loot Pool Items",
      size:       "small",
      backdrop:   true,
      withDivider:true,
      onClose:    () => closeModal(pickerModal)
    });
    pickerModal   = created.modal;
    pickerHeader  = created.header;
    pickerContent = created.content;

    // 2) search box
    pickerSearch = document.createElement("input");
    pickerSearch.type        = "search";
    pickerSearch.placeholder = "Search…";
    pickerSearch.classList.add("ui-input");
    pickerHeader.appendChild(pickerSearch);

    // 3) list container
    pickerList = document.createElement("div");
    pickerList.classList.add("loot-pool-picker");
    pickerContent.appendChild(pickerList);

    // 4) footer buttons
    const footer = document.createElement("div");
    footer.classList.add("picker-footer");
    pickerSave   = document.createElement("button");
    pickerSave.type        = "button";
    pickerSave.className   = "ui-button";
    pickerSave.textContent = "Save";
    pickerCancel = document.createElement("button");
    pickerCancel.type        = "button";
    pickerCancel.className   = "ui-button";
    pickerCancel.textContent = "Cancel";
    footer.append(pickerCancel, pickerSave);
    pickerContent.appendChild(footer);

    // 5) wiring
    pickerSearch.addEventListener("input", filterPicker);
    pickerSave.onclick   = () => {
      // pull all checked
      const selectedIds = [...pickerList.querySelectorAll("input:checked")].map(cb => cb.value);
      fields.lootPool.splice(0, fields.lootPool.length, ...selectedIds);
      renderChips();
      closeModal(pickerModal);
    };
    pickerCancel.onclick = () => closeModal(pickerModal);
  }

  async function refreshPickerItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
    pickerList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      row.classList.add("picker-item");
      // checkbox
      const cb = document.createElement("input");
      cb.type  = "checkbox";
      cb.value = item.id;
      cb.checked = fields.lootPool.includes(item.id);
      // label
      const lbl = document.createElement("span");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      // click anywhere toggles
      row.onclick = e => {
        if (e.target !== cb) cb.checked = !cb.checked;
        row.classList.toggle("selected", cb.checked);
      };
      // initial selected state
      if (cb.checked) row.classList.add("selected");
      pickerList.appendChild(row);
    });
  }

  function filterPicker() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.querySelectorAll(".picker-item").forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  //
  // ─── CHIPS ───────────────────────────────────────────────────────────────────
  //
  function renderChips() {
    fields.chipContainer.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.classList.add("loot-pool-chip");
      chip.textContent = def.name;
      // remove icon
      const x = document.createElement("span");
      x.classList.add("remove-chip");
      x.textContent = "×";
      x.onclick = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
        renderChips();
      };
      chip.appendChild(x);
      fields.chipContainer.appendChild(chip);
    });
  }

  //
  // ─── INITIAL LOOT OPTIONS ───────────────────────────────────────────────────
  //
  (async function initLoot() {
    allItems = await loadItemDefinitions(db);
    renderChips();
  })();

  // hook the cog button
  fields.openLootPicker.onclick = async () => {
    await ensurePicker();
    await refreshPickerItems();
    pickerSearch.value = "";
    filterPicker();
    openModal(pickerModal);
  };

  //
  // ─── RESET / POPULATE / SUBMIT ───────────────────────────────────────────────
  //
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
  }

  function populate(def) {
    form.reset();
    fields.fldName.value       = def.name       || "";
    fields.fldIconUrl.value    = def.iconUrl    || "";
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool||[]));
    renderChips();
    fields.fldMaxDisplay.value = def.maxDisplay || "";
    _id = def.id;
    form.querySelector(".ui-button-delete").style.display = "";
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit({
      id:          _id,
      name:        fields.fldName.value.trim(),
      iconUrl:     fields.fldIconUrl.value.trim(),
      maxDisplay:  parseInt(fields.fldMaxDisplay.value, 10) || 1,
      lootPool:    [...fields.lootPool]
    });
  });

  // delete & cancel wiring
  form.querySelector(".ui-button-delete").onclick = () => {
    if (_id && confirm("Delete this chest type?")) onDelete(_id);
  };
  form.querySelector("button[type=button]").onclick = onCancel;

  return { form, reset, populate };
}
