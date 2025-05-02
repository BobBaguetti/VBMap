// @version: 2.2
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createPickr }         from "../../ui/pickrManager.js";
import { getPickrHexColor }    from "../../../utils/colorUtils.js";
import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createNpcFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  const pickrs = {};
  let _id = null;

  // picker state
  let lootPickerModal, lootPickerContent, lootSearch, lootList;
  let vendorPickerModal, vendorPickerContent, vendorSearch, vendorList;
  let allItems = [];

  // ─── Header + Buttons ─────────────────────────────────────────────
  const titleEl = document.createElement("h3");
  titleEl.textContent = "Add NPC";
  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";

  const btnSave   = document.createElement("button");
  btnSave.type    = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear  = document.createElement("button");
  btnClear.type   = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick = () => { reset(); onCancel?.(); };

  const btnDelete = document.createElement("button");
  btnDelete.type    = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id) onDelete?.(_id).then(reset);
  };

  btnRow.append(btnSave, btnClear, btnDelete);
  form.prepend(titleEl, btnRow);

  // ─── Helpers ───────────────────────────────────────────────────────
  async function ensureAllItems() {
    if (!allItems.length) {
      allItems = await loadItemDefinitions(db);
    }
  }

  // ─── Loot Picker ──────────────────────────────────────────────────
  async function buildLootPicker() {
    if (lootPickerModal) return;
    const { modal, header, content } = createModal({
      id: "npc-loot-picker",
      title: "Select Loot Pool Items",
      size: "small",
      backdrop: true,
      withDivider: true,
      onClose: () => closeModal(modal)
    });
    lootPickerModal   = modal;
    lootPickerContent = content;

    lootSearch = document.createElement("input");
    lootSearch.type = "text";
    lootSearch.placeholder = "Search…";
    header.appendChild(lootSearch);

    lootList = document.createElement("div");
    Object.assign(lootList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(lootList);

    const row = document.createElement("div");
    row.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "ui-button"; cancel.textContent = "Cancel";
    cancel.onclick = () => closeModal(modal);
    const save = document.createElement("button");
    save.type = "button"; save.className = "ui-button"; save.textContent = "Save";
    save.onclick = saveLootPicker;
    row.append(cancel, save);
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
      const r = document.createElement("div");
      Object.assign(r.style, { display:"flex", alignItems:"center", padding:"4px 0" });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
      cb.checked = fields.lootPool.some(l => l.id === item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      r.append(cb, lbl);
      lootList.append(r);
    });
    openModal(lootPickerModal);
  }

  function saveLootPicker() {
    const sel = Array.from(
      lootList.querySelectorAll("input:checked")
    ).map(cb => {
      const d = allItems.find(i => i.id === cb.value);
      return d && { text: d.name, color: "#ccc", id: d.id };
    }).filter(Boolean);
    fields.lootPool = sel;
    if (fields.chipContainer) fields.chipContainer.innerHTML = "";
    sel.forEach(item => {
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
      fields.chipContainer?.append(chip);
    });
    closeModal(lootPickerModal);
  }

  // ─── Vendor Picker ────────────────────────────────────────────────
  async function buildVendorPicker() {
    if (vendorPickerModal) return;
    const { modal, header, content } = createModal({
      id: "npc-vendor-picker",
      title: "Select Vendor Inventory",
      size: "small",
      backdrop: true,
      withDivider: true,
      onClose: () => closeModal(modal)
    });
    vendorPickerModal   = modal;
    vendorPickerContent = content;

    vendorSearch = document.createElement("input");
    vendorSearch.type = "text";
    vendorSearch.placeholder = "Search…";
    header.appendChild(vendorSearch);

    vendorList = document.createElement("div");
    Object.assign(vendorList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(vendorList);

    const row = document.createElement("div");
    row.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "ui-button"; cancel.textContent = "Cancel";
    cancel.onclick = () => closeModal(modal);
    const save = document.createElement("button");
    save.type = "button"; save.className = "ui-button"; save.textContent = "Save";
    save.onclick = saveVendorPicker;
    row.append(cancel, save);
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
      const r = document.createElement("div");
      Object.assign(r.style, { display:"flex", alignItems:"center", padding:"4px 0" });
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = item.id;
      cb.checked = fields.vendorInv.some(v => v.id === item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      r.append(cb, lbl);
      vendorList.append(r);
    });
    openModal(vendorPickerModal);
  }

  function saveVendorPicker() {
    const sel = Array.from(
      vendorList.querySelectorAll("input:checked")
    ).map(cb => {
      const d = allItems.find(i => i.id === cb.value);
      return d && { text: d.name, color: "#ccc", id: d.id };
    }).filter(Boolean);
    fields.vendorInv = sel;
    if (fields.chipContainerVend) fields.chipContainerVend.innerHTML = "";
    sel.forEach(item => {
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = item.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        fields.vendorInv = fields.vendorInv.filter(v => v.id !== item.id);
        chip.remove();
      };
      chip.append(x);
      fields.chipContainerVend?.append(chip);
    });
    closeModal(vendorPickerModal);
  }

  // ─── Reset / Populate / getCustom ─────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add NPC";
    btnDelete.style.display = "none";

    // clear chips safely
    fields.lootPool = [];
    if (fields.chipContainer) fields.chipContainer.innerHTML = "";

    fields.vendorInv = [];
    if (fields.chipContainerVend) fields.chipContainerVend.innerHTML = "";

    // clear extra‐info
    if (fields.extraInfoBlock?.extraInfo) {
      fields.extraInfoBlock.extraInfo.setLines([], false);
    }

    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  function populate(def = {}) {
    _id = def.id || null;
    titleEl.textContent = _id ? "Edit NPC" : "Add NPC";
    btnDelete.style.display = _id ? "" : "none";

    fields.fldName.value   = def.name      || "";
    fields.fldHealth.value = def.health    ?? "";
    fields.fldDamage.value = def.damage    ?? "";
    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags) && def.typeFlags.includes(cb.value);
    });

    // repopulate chips
    reset(); // clear everything first
    (def.lootPool || []).forEach(l => {
      fields.lootPool.push(l);
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = l.text;
      const x = document.createElement("span");
      x.className = "remove-chip"; x.textContent = "×";
      x.onclick = () => chip.remove();
      chip.append(x);
      fields.chipContainer?.append(chip);
    });

    (def.vendorInventory || []).forEach(v => {
      fields.vendorInv.push(v);
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = v.text;
      const x = document.createElement("span");
      x.className = "remove-chip"; x.textContent = "×";
      x.onclick = () => chip.remove();
      chip.append(x);
      fields.chipContainerVend?.append(chip);
    });

    if (fields.extraInfoBlock?.extraInfo) {
      fields.extraInfoBlock.extraInfo.setLines(def.extraLines||[], false);
    }
  }

  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      typeFlags:        fields.fldTypeFlags.filter(cb=>cb.checked).map(cb=>cb.value),
      health:           Number(fields.fldHealth.value) || 0,
      damage:           Number(fields.fldDamage.value) || 0,
      lootPool:         fields.lootPool,
      vendorInventory:  fields.vendorInv,
      extraLines:       fields.extraInfoBlock?.extraInfo.getLines() || []
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // wire up the picker buttons:
  fields.openLootPicker?.addEventListener("click", openLootPicker);
  fields.openVendorPicker?.addEventListener("click", openVendorPicker);

  return { form, reset, populate };
}
