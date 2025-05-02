// @version: 3.1 — wire in Extra Info block under Description
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createNpcFormController(db, { onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;
  let allItems = [];

  // picker modals
  let lootModal, vendModal, lootSearch, lootList, vendSearch, vendList;

  // ─── ensure item defs are loaded ───────────────────────────────
  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  // ─── build (or return) a picker ────────────────────────────────
  function buildPicker(type) {
    const isLoot = type === "loot";
    let existing = isLoot ? lootModal : vendModal;
    if (existing) return existing;

    const { modal, header, content } = createModal({
      id: `npc-${type}-picker`,
      title: isLoot ? "Select Loot Pool Items" : "Select Vendor Inventory",
      size: "small", backdrop: true, withDivider: true,
      onClose: () => closeModal(modal)
    });

    // search input
    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search…";
    header.appendChild(search);

    // list container
    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "200px", overflowY: "auto", margin: "8px 0"
    });
    content.appendChild(list);

    // action buttons
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const btnCancel = document.createElement("button");
    btnCancel.type = "button"; btnCancel.className = "ui-button";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = () => closeModal(modal);

    const btnSave = document.createElement("button");
    btnSave.type = "button"; btnSave.className = "ui-button";
    btnSave.textContent = "Save";
    btnSave.onclick = () => savePicker(type);

    btnRow.append(btnCancel, btnSave);
    content.appendChild(btnRow);

    // wire filter
    search.addEventListener("input", () => filterPicker(type));

    if (isLoot) {
      lootModal  = modal;
      lootSearch = search;
      lootList   = list;
    } else {
      vendModal  = modal;
      vendSearch = search;
      vendList   = list;
    }

    return modal;
  }

  // ─── open + populate picker ────────────────────────────────────
  async function openPicker(type) {
    await ensureItems();
    buildPicker(type);

    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    list.innerHTML = "";

    // determine currently selected IDs
    const selectedIds = (type === "loot"
      ? fields.lootPoolBlock.getLines()
      : fields.vendorInvBlock.getLines()
    ).map(l => l.id);

    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, { display: "flex", alignItems: "center", padding: "4px 0" });
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = item.id;
      cb.checked = selectedIds.includes(item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      list.append(row);
    });

    search.value = "";
    filterPicker(type);
    openModal(type === "loot" ? lootModal : vendModal);
  }

  // ─── filter the picker rows ───────────────────────────────────
  function filterPicker(type) {
    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    const q = search.value.toLowerCase();
    Array.from(list.children).forEach(r => {
      const txt = r.querySelector("label").textContent.toLowerCase();
      r.style.display = txt.includes(q) ? "" : "none";
    });
  }

  // ─── save picker selections ────────────────────────────────────
  function savePicker(type) {
    const list = type === "loot" ? lootList : vendList;
    const lines = Array.from(list.querySelectorAll("input:checked"))
      .map(cb => {
        const d = allItems.find(i => i.id === cb.value);
        return d && { id: d.id, text: d.name, color: "#ccc" };
      })
      .filter(Boolean);

    if (type === "loot") {
      fields.lootPoolBlock.setLines(lines, false);
      closeModal(lootModal);
    } else {
      fields.vendorInvBlock.setLines(lines, false);
      closeModal(vendModal);
    }
  }

  // ─── Reset / Populate / getCustom ─────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPoolBlock.setLines([], false);
    fields.vendorInvBlock.setLines([], false);
    fields.extraInfo.setLines([], false);
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  function populate(def = {}) {
    _id = def.id || null;
    form.querySelector("h3").textContent = _id ? "Edit NPC" : "Add NPC";

    fields.fldName.value   = def.name           || "";
    fields.fldHealth.value = def.health         ?? "";
    fields.fldDamage.value = def.damage         ?? "";
    fields.fldDesc.value   = def.description    || "";
    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags) && def.typeFlags.includes(cb.value);
    });

    fields.lootPoolBlock.setLines(def.lootPool || [], false);
    fields.vendorInvBlock.setLines(def.vendorInventory || [], false);
    fields.extraInfo.setLines(def.extraLines || [], false);
  }

  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      typeFlags:        fields.fldTypeFlags.filter(cb => cb.checked).map(cb => cb.value),
      health:           Number(fields.fldHealth.value) || 0,
      damage:           Number(fields.fldDamage.value) || 0,
      lootPool:         fields.lootPoolBlock.getLines(),
      vendorInventory:  fields.vendorInvBlock.getLines(),
      extraLines:       fields.extraInfo.getLines(),
      description:      fields.fldDesc.value.trim()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // ─── wire picker buttons ───────────────────────────────────────
  fields.openLootPicker .addEventListener("click", () => openPicker("loot"));
  fields.openVendorPicker.addEventListener("click", () => openPicker("vend"));

  return { form, reset, populate };
}
