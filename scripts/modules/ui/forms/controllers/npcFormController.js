// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 2.6 — wired to new builder with single Description

import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createNpcFormController(db, { onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;
  let allItems = [];

  // Picker modals state
  let lootModal, vendModal;
  let lootSearch, lootList, vendSearch, vendList;

  // Ensure we've loaded item definitions
  async function ensureItems() {
    if (!allItems.length) {
      allItems = await loadItemDefinitions(db);
    }
  }

  // Build picker (loot or vendor)
  function buildPicker(type) {
    const isLoot = type === "loot";
    let modal = isLoot ? lootModal : vendModal;
    if (modal) return modal;

    const { modal: m, header, content } = createModal({
      id: `npc-${type}-picker`,
      title: isLoot ? "Select Loot Pool Items" : "Select Vendor Inventory",
      size: "small",
      backdrop: true,
      withDivider: true,
      onClose: () => closeModal(m)
    });

    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search…";
    header.appendChild(search);

    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(list);

    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ui-button";
    cancel.textContent = "Cancel";
    cancel.onclick = () => closeModal(m);

    const save = document.createElement("button");
    save.type = "button";
    save.className = "ui-button";
    save.textContent = "Save";
    save.onclick = () => savePicker(type);

    btnRow.append(cancel, save);
    content.append(btnRow);

    search.addEventListener("input", () => filterPicker(type));

    if (isLoot) {
      lootModal  = m;
      lootSearch = search;
      lootList   = list;
    } else {
      vendModal  = m;
      vendSearch = search;
      vendList   = list;
    }

    return m;
  }

  // Open and populate picker
  async function openPicker(type) {
    await ensureItems();
    buildPicker(type);
    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    list.innerHTML = "";

    const selectedIds = (type === "loot"
      ? fields.lootPoolBlock.getLines()
      : fields.vendorInvBlock.getLines()
    ).map(l => l.id);

    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, { display: "flex", alignItems: "center", padding: "4px 0" });

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
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

  // Filter picker list
  function filterPicker(type) {
    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    const q = search.value.toLowerCase();
    Array.from(list.children).forEach(r => {
      const txt = r.querySelector("label").textContent.toLowerCase();
      r.style.display = txt.includes(q) ? "" : "none";
    });
  }

  // Save picker selections back into form
  function savePicker(type) {
    const list = type === "loot" ? lootList : vendList;
    const lines = Array.from(list.querySelectorAll("input:checked"))
      .map(cb => {
        const def = allItems.find(i => i.id === cb.value);
        return def && { id: def.id, text: def.name, color: "#ccc" };
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

  // Reset form
  function reset() {
    form.reset();
    _id = null;
    fields.lootPoolBlock.setLines([], false);
    fields.vendorInvBlock.setLines([], false);
    fields.fldDesc.value = "";
    form.querySelector("h3").textContent = "Add NPC";
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  // Populate form for editing
  function populate(def = {}) {
    _id = def.id || null;
    form.querySelector("h3").textContent = _id ? "Edit NPC" : "Add NPC";

    fields.fldName.value   = def.name      || "";
    fields.fldHealth.value = def.health    ?? "";
    fields.fldDamage.value = def.damage    ?? "";
    fields.fldDesc.value   = def.description || "";

    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags) && def.typeFlags.includes(cb.value);
    });

    fields.lootPoolBlock.setLines(def.lootPool || [], false);
    fields.vendorInvBlock.setLines(def.vendorInventory || [], false);
  }

  // Gather submission data
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      typeFlags:        fields.fldTypeFlags.filter(cb => cb.checked).map(cb => cb.value),
      health:           Number(fields.fldHealth.value) || 0,
      damage:           Number(fields.fldDamage.value) || 0,
      lootPool:         fields.lootPoolBlock.getLines(),
      vendorInventory:  fields.vendorInvBlock.getLines(),
      description:      fields.fldDesc.value.trim()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // Wire up the two picker buttons
  fields.openLootPicker .addEventListener("click", () => openPicker("loot"));
  fields.openVendorPicker.addEventListener("click", () => openPicker("vend"));

  return { form, reset, populate };
}
