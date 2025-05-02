// @version: 1.4
// @file: scripts/modules/ui/forms/controllers/npcFormController.js

import { createPickr }         from "../../pickrManager.js";
import { getPickrHexColor }    from "../../../utils/colorUtils.js";
import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createNpcFormController(db, { onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;
  let allItems = [];

  // picker state
  let lootPickerModal, lootSearch, lootList;
  let vendorPickerModal, vendorSearch, vendorList;

  async function ensureAllItems() {
    if (allItems.length) return;
    allItems = await loadItemDefinitions(db);
  }

  // ─── Loot Picker ──────────────────────────────────────────────────
  async function buildLootPicker() {
    if (lootPickerModal) return;
    const { modal, header, content } = createModal({
      id:           "npc-loot-picker",
      title:        "Select Loot Pool Items",
      size:         "small",
      backdrop:     true,
      withDivider:  true,
      onClose:      () => closeModal(modal)
    });
    lootPickerModal = modal;

    lootSearch = document.createElement("input");
    lootSearch.type = "text";
    lootSearch.placeholder = "Search…";
    header.appendChild(lootSearch);

    lootList = document.createElement("div");
    Object.assign(lootList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin:    "8px 0"
    });
    content.appendChild(lootList);

    const row = document.createElement("div");
    row.style.textAlign = "right";
    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "ui-button";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = () => closeModal(modal);

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "ui-button";
    btnSave.textContent = "Save";
    btnSave.onclick = saveLootPicker;

    row.append(btnCancel, btnSave);
    content.append(row);

    lootSearch.addEventListener("input", () => {
      const q = lootSearch.value.toLowerCase();
      lootList.childNodes.forEach(r => {
        const txt = r.querySelector("label").textContent.toLowerCase();
        r.style.display = txt.includes(q) ? "" : "none";
      });
    });
  }

  async function openLootPicker() {
    await buildLootPicker();
    await ensureAllItems();

    lootList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display:    "flex",
        alignItems: "center",
        padding:    "4px 0"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
      cb.style.marginRight = "8px";
      // check if already selected
      cb.checked = fields.lootPool.some(l => l.id === item.id);

      const lbl = document.createElement("label");
      lbl.textContent = item.name;

      row.append(cb, lbl);
      lootList.append(row);
    });

    lootSearch.value = "";
    lootSearch.dispatchEvent(new Event("input"));
    openModal(lootPickerModal);
  }

  function saveLootPicker() {
    const selected = Array.from(
      lootList.querySelectorAll("input:checked")
    ).map(cb => {
      const d = allItems.find(i => i.id === cb.value);
      return d && { text: d.name, color: "#ccc", id: d.id };
    }).filter(Boolean);

    fields.lootPool = selected;
    // update chips via builder’s extraInfoBlock API
    fields.chipContainer.innerHTML = "";
    selected.forEach(item => {
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = item.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        fields.lootPool = fields.lootPool.filter(l => l.id !== item.id);
        chip.remove();
      };
      chip.append(x);
      fields.chipContainer.append(chip);
    });

    closeModal(lootPickerModal);
  }

  // ─── Vendor Picker ────────────────────────────────────────────────
  async function buildVendorPicker() {
    if (vendorPickerModal) return;
    const { modal, header, content } = createModal({
      id:           "npc-vendor-picker",
      title:        "Select Vendor Inventory",
      size:         "small",
      backdrop:     true,
      withDivider:  true,
      onClose:      () => closeModal(modal)
    });
    vendorPickerModal = modal;

    vendorSearch = document.createElement("input");
    vendorSearch.type = "text";
    vendorSearch.placeholder = "Search…";
    header.appendChild(vendorSearch);

    vendorList = document.createElement("div");
    Object.assign(vendorList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin:    "8px 0"
    });
    content.appendChild(vendorList);

    const row = document.createElement("div");
    row.style.textAlign = "right";
    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "ui-button";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = () => closeModal(modal);

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "ui-button";
    btnSave.textContent = "Save";
    btnSave.onclick = saveVendorPicker;

    row.append(btnCancel, btnSave);
    content.append(row);

    vendorSearch.addEventListener("input", () => {
      const q = vendorSearch.value.toLowerCase();
      vendorList.childNodes.forEach(r => {
        const txt = r.querySelector("label").textContent.toLowerCase();
        r.style.display = txt.includes(q) ? "" : "none";
      });
    });
  }

  async function openVendorPicker() {
    await buildVendorPicker();
    await ensureAllItems();

    vendorList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display:    "flex",
        alignItems: "center",
        padding:    "4px 0"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
      cb.style.marginRight = "8px";
      cb.checked = fields.vendorInv.some(l => l.id === item.id);

      const lbl = document.createElement("label");
      lbl.textContent = item.name;

      row.append(cb, lbl);
      vendorList.append(row);
    });

    vendorSearch.value = "";
    vendorSearch.dispatchEvent(new Event("input"));
    openModal(vendorPickerModal);
  }

  function saveVendorPicker() {
    const selected = Array.from(
      vendorList.querySelectorAll("input:checked")
    ).map(cb => {
      const d = allItems.find(i => i.id === cb.value);
      return d && { text: d.name, color: "#ccc", id: d.id };
    }).filter(Boolean);

    fields.vendorInv = selected;
    fields.chipContainerVend.innerHTML = "";
    selected.forEach(item => {
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = item.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        fields.vendorInv = fields.vendorInv.filter(l => l.id !== item.id);
        chip.remove();
      };
      chip.append(x);
      fields.chipContainerVend.append(chip);
    });

    closeModal(vendorPickerModal);
  }

  // ─── Reset / Populate / getCustom ─────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool = [];
    fields.chipContainer.innerHTML = "";
    fields.vendorInv = [];
    fields.chipContainerVend.innerHTML = "";
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  function populate(def = {}) {
    _id = def.id || null;
    form.querySelector("h3").textContent = _id ? "Edit NPC" : "Add NPC";
    fields.fldName.value   = def.name   || "";
    fields.fldHealth.value = def.health ?? "";
    fields.fldDamage.value = def.damage ?? "";

    fields.fldTypeFlags.forEach(cb => {
      cb.checked = (def.typeFlags || []).includes(cb.value);
    });

    // rebuild chips
    reset();
    (def.lootPool || []).forEach(l => {
      fields.lootPool.push(l);
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = l.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => chip.remove();
      chip.append(x);
      fields.chipContainer.append(chip);
    });
    (def.vendorInventory || []).forEach(v => {
      fields.vendorInv.push(v);
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = v.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => chip.remove();
      chip.append(x);
      fields.chipContainerVend.append(chip);
    });
  }

  function getCustom() {
    return {
      id:              _id,
      name:            fields.fldName.value.trim(),
      typeFlags:       fields.fldTypeFlags.filter(cb => cb.checked).map(cb => cb.value),
      health:          Number(fields.fldHealth.value) || 0,
      damage:          Number(fields.fldDamage.value) || 0,
      lootPool:        fields.lootPool,
      vendorInventory: fields.vendorInv
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // wire up the picker buttons:
  fields.openLootPicker.addEventListener("click", openLootPicker);
  fields.openVendorPicker.addEventListener("click", openVendorPicker);

  return { form, reset, populate };
}
