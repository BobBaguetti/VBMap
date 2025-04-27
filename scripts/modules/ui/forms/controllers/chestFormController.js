// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 1.2 – loot-pool picker integrated

import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createChestFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createChestForm();
  let _id = null;

  // ─── Build & wire the loot-picker modal ─────────────────────────
  let pickerModal, pickerContent, pickerHeader;
  let pickerList, pickerSearch, pickerSave, pickerCancel;
  let allItems = [];

  async function ensurePicker() {
    if (pickerModal) return;
    // 1) Create the modal shell
    const created = createModal({
      id:       "chest-loot-picker",
      title:    "Select Loot Pool Items",
      size:     "small",
      backdrop: true,
      withDivider: true,
      onClose:  () => closeModal(pickerModal)
    });
    pickerModal   = created.modal;
    pickerHeader  = created.header;
    pickerContent = created.content;

    // 2) Search box
    pickerSearch = document.createElement("input");
    pickerSearch.type = "text";
    pickerSearch.placeholder = "Search…";
    pickerSearch.style.width = "100%";
    pickerSearch.style.marginBottom = "8px";
    pickerHeader.appendChild(pickerSearch);

    // 3) Scrollable list container
    pickerList = document.createElement("div");
    Object.assign(pickerList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      marginBottom: "8px"
    });
    pickerContent.appendChild(pickerList);

    // 4) Save / Cancel buttons
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    pickerSave   = document.createElement("button");
    pickerSave.type = "button";
    pickerSave.className = "ui-button";
    pickerSave.textContent = "Save";
    pickerCancel = document.createElement("button");
    pickerCancel.type = "button";
    pickerCancel.className = "ui-button";
    pickerCancel.textContent = "Cancel";
    btnRow.append(pickerCancel, pickerSave);
    pickerContent.appendChild(btnRow);

    // 5) Wire up search/filter
    pickerSearch.addEventListener("input", filterPickerList);

    // 6) Wire Save/Cancel
    pickerSave.onclick = () => {
      // collect checked IDs
      const selected = Array.from(
        pickerList.querySelectorAll("input[type=checkbox]:checked")
      ).map(cb => cb.value);
      fields.lootPool.splice(0, fields.lootPool.length, ...selected);
      renderChips();
      closeModal(pickerModal);
    };
    pickerCancel.onclick = () => {
      closeModal(pickerModal);
    };
  }

  // Populate the picker list with checkboxes
  async function refreshPickerItems() {
    if (!allItems.length) {
      allItems = await loadItemDefinitions(db);
    }
    // clear
    pickerList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.padding = "4px 0";

      const cb = document.createElement("input");
      cb.type  = "checkbox";
      cb.value = item.id;
      cb.checked = fields.lootPool.includes(item.id);
      cb.style.marginRight = "8px";

      const lbl = document.createElement("label");
      lbl.textContent = item.name;

      row.append(cb, lbl);
      pickerList.appendChild(row);
    });
  }

  // Filter by name
  function filterPickerList() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.querySelectorAll("div").forEach(row => {
      const lbl = row.querySelector("label").textContent.toLowerCase();
      row.style.display = lbl.includes(q) ? "" : "none";
    });
  }

  // Render the “chips” in the form
  function renderChips() {
    const container = fields.chipContainer;
    container.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;
      chip.style.cssText = `
        background:#444; color:#eee;
        border-radius:12px; padding:2px 8px;
        margin:2px; display:inline-flex;
        align-items:center; font-size:0.9em;
      `;
      // × remove button
      const x = document.createElement("span");
      x.textContent = "×";
      x.style.cssText = `
        margin-left:6px; cursor:pointer;
      `;
      x.onclick = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id),1);
        renderChips();
      };
      chip.appendChild(x);
      container.appendChild(chip);
    });
  }

  // ─── Populate loot-pool options on form load ────────────────────
  async function initLootOptions() {
    allItems = await loadItemDefinitions(db);
    // initial render of chips (empty at first)
    renderChips();
  }
  initLootOptions();

  // Wire up picker button
  fields.openLootPicker.onclick = async () => {
    await ensurePicker();
    await refreshPickerItems();
    pickerSearch.value = "";
    filterPickerList();
    openModal(pickerModal);
  };

  // ─── Reset to “Add” mode ────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
  }

  // ─── Populate for “Edit” mode ──────────────────────────────────
  function populate(def) {
    form.reset();
    fields.fldName.value    = def.name       || "";
    fields.fldIconUrl.value = def.iconUrl    || "";
    // copy into our array
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool||[]));
    renderChips();
    fields.fldMaxDisplay.value = def.maxDisplay || "";
    _id = def.id;

    // show delete button
    form.querySelector(".ui-button-delete").style.display = "";
  }

  // ─── Gather payload ────────────────────────────────────────────
  function getCustom() {
    return {
      id:          _id,
      name:        fields.fldName.value.trim(),
      iconUrl:     fields.fldIconUrl.value.trim(),
      maxDisplay:  parseInt(fields.fldMaxDisplay.value, 10) || 1,
      lootPool:    [...fields.lootPool]
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit(getCustom());
  });

  // wire up delete & cancel
  form.querySelector(".ui-button-delete").onclick = () => {
    if (_id && confirm("Delete this chest type?")) {
      onDelete(_id);
    }
  };
  form.querySelector("button[type=button]").onclick = onCancel;

  return {
    form,
    reset,
    populate,
    getCustom
  };
}
