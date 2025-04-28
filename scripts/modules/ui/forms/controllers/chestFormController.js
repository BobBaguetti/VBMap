// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 1.4 – guard delete-button access in reset() & populate()

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createChestFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createChestForm();
  let _id = null;

  // ─── Loot‐picker modal setup ────────────────────────────────────
  let pickerModal, pickerContent, pickerHeader;
  let pickerList, pickerSearch, pickerSave, pickerCancel;
  let allItems = [];

  async function ensurePicker() {
    if (pickerModal) return;
    const created = createModal({
      id:          "chest-loot-picker",
      title:       "Select Loot Pool Items",
      size:        "small",
      backdrop:    true,
      withDivider: true,
      onClose:     () => closeModal(pickerModal)
    });
    pickerModal   = created.modal;
    pickerHeader  = created.header;
    pickerContent = created.content;

    // search box
    pickerSearch = document.createElement("input");
    pickerSearch.type = "text";
    pickerSearch.placeholder = "Search…";
    pickerHeader.appendChild(pickerSearch);

    // list container
    pickerList = document.createElement("div");
    Object.assign(pickerList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin:    "8px 0"
    });
    pickerContent.appendChild(pickerList);

    // buttons row
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    pickerCancel = document.createElement("button");
    pickerCancel.type = "button";
    pickerCancel.className = "ui-button";
    pickerCancel.textContent = "Cancel";
    pickerSave   = document.createElement("button");
    pickerSave.type = "button";
    pickerSave.className = "ui-button";
    pickerSave.textContent = "Save";
    btnRow.append(pickerCancel, pickerSave);
    pickerContent.appendChild(btnRow);

    pickerSearch.addEventListener("input", filterPickerList);
    pickerSave.onclick   = savePicker;
    pickerCancel.onclick = () => closeModal(pickerModal);
  }

  async function refreshPickerItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
    pickerList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, { display:"flex", alignItems:"center", padding:"4px 0" });
      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.value   = item.id;
      cb.checked = fields.lootPool.includes(item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      pickerList.appendChild(row);
    });
  }

  function filterPickerList() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  function savePicker() {
    const selected = Array.from(
      pickerList.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => cb.value);
    fields.lootPool.splice(0, fields.lootPool.length, ...selected);
    renderChips();
    closeModal(pickerModal);
  }

  function renderChips() {
    const container = fields.chipContainer;
    container.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
        renderChips();
      };
      chip.append(x);
      container.append(chip);
    });
  }

  // trigger loot picker
  fields.openLootPicker.onclick = async () => {
    await ensurePicker();
    await refreshPickerItems();
    pickerSearch.value = "";
    filterPickerList();
    openModal(pickerModal);
  };

  // ─── Add Save/Cancel/Delete buttons ─────────────────────────────
  (() => {
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

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "ui-button-delete";
    btnDelete.textContent = "Delete";
    btnDelete.style.display = "none";
    btnDelete.onclick = () => {
      if (_id && confirm("Delete this chest type?")) {
        onDelete(_id);
      }
    };

    btnRow.append(btnSave, btnCancel, btnDelete);
    form.appendChild(btnRow);
  })();

  // initialize chips
  (async function init() {
    allItems = await loadItemDefinitions(db);
    renderChips();
  })();

  // ─── Reset & Populate ───────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
    const delBtn = form.querySelector(".ui-button-delete");
    if (delBtn) delBtn.style.display = "none";
  }

  function populate(def) {
    form.reset();
    fields.fldName.value    = def.name    || "";
    fields.fldIconUrl.value = def.iconUrl || "";
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool || []));
    renderChips();
    _id = def.id;
    const delBtn = form.querySelector(".ui-button-delete");
    if (delBtn) delBtn.style.display = "";
  }

  // ─── Form submission ────────────────────────────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit({
      id:       _id,
      name:     fields.fldName.value.trim(),
      iconUrl:  fields.fldIconUrl.value.trim(),
      lootPool: [...fields.lootPool]
    });
  });

  return {
    form,
    reset,
    populate,
    getCustom: () => ({
      name:    fields.fldName.value.trim(),
      iconUrl: fields.fldIconUrl.value.trim(),
      lootPool:[...fields.lootPool]
    })
  };
}
