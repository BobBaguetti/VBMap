// @version: 4.1 – use extra.setLines for clearing extra-info
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

export function createNpcFormController(db, { onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  let _id = null;
  let allItems = [];

  // Picker modals state
  let lootModal, vendModal, lootSearch, lootList, vendSearch, vendList;

  // Ensure item definitions are loaded
  async function ensureItems() {
    if (!allItems.length) {
      allItems = await loadItemDefinitions(db);
    }
  }

  // Build or return existing picker modal
  function buildPicker(type) {
    const isLoot = type === "loot";
    let modalRef = isLoot ? lootModal : vendModal;
    if (modalRef) return modalRef;

    const { modal, header, content } = createModal({
      id: `npc-${type}-picker`,
      title: isLoot ? "Select Loot Pool Items" : "Select Vendor Inventory",
      size: "small", backdrop: true, withDivider: true,
      onClose: () => closeModal(modal)
    });

    // Search input
    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search…";
    header.appendChild(search);

    // List container
    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(list);

    // Action buttons
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "ui-button";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = () => closeModal(modal);
    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "ui-button";
    btnSave.textContent = "Save";
    btnSave.onclick = () => savePicker(type);
    btnRow.append(btnCancel, btnSave);
    content.appendChild(btnRow);

    // Wire filtering
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

  // Open and populate picker
  async function openPicker(type) {
    await ensureItems();
    buildPicker(type);

    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    list.innerHTML = "";

    const selectedIDs = type === "loot" ? fields.lootPool : fields.vendorInv;

    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex", alignItems: "center", padding: "4px 0"
      });

      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.value   = item.id;
      cb.checked = selectedIDs.includes(item.id);
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
    Array.from(list.children).forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  // Save picker selections
  function savePicker(type) {
    const list = type === "loot" ? lootList : vendList;
    const lines = Array.from(list.querySelectorAll("input:checked")).map(cb => {
      const item = allItems.find(i => i.id === cb.value);
      return { id: cb.value, text: item.name, color: "#ccc", imageS: item.imageS };
    });

    const container = type === "loot"
      ? fields.chipContainerLoot
      : fields.chipContainerVend;

    if (type === "loot") {
      fields.lootPool = lines.map(l => l.id);
    } else {
      fields.vendorInv = lines.map(l => l.id);
    }
    container.innerHTML = "";
    lines.forEach(l => {
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = l.text;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        const arr = type === "loot" ? fields.lootPool : fields.vendorInv;
        arr.splice(arr.indexOf(l.id), 1);
        chip.remove();
      };
      chip.append(x);
      container.append(chip);
    });

    closeModal(type === "loot" ? lootModal : vendModal);
  }

  // Reset form to Add mode
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool = [];
    fields.vendorInv = [];
    fields.chipContainerLoot.innerHTML = "";
    fields.chipContainerVend.innerHTML = "";
    // Clear extra-info using correct API
    fields.extra.setLines([], false);
  }

  // Populate for Edit mode
  function populate(def = {}) {
    _id = def.id || null;
    form.querySelector("h3").textContent = _id ? "Edit NPC" : "Add NPC";

    fields.fldName.value   = def.name || "";
    fields.fldHealth.value = def.health ?? "";
    fields.fldDamage.value = def.damage ?? "";
    fields.fldDesc.value   = def.description || "";
    fields.fldImgS.value   = def.imageS || "";
    fields.fldImgL.value   = def.imageL || "";
    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags) && def.typeFlags.includes(cb.value);
    });
    // Populate extra-info lines
    fields.extra.setLines(def.extraLines || [], false);

    // Render chips for loot and vendor
    savePicker("loot");
    savePicker("vend");
  }

  // Gather payload
  function getCustom() {
    return {
      id:              _id,
      name:            fields.fldName.value.trim(),
      typeFlags:       fields.fldTypeFlags.filter(cb => cb.checked).map(cb => cb.value),
      health:          Number(fields.fldHealth.value) || 0,
      damage:          Number(fields.fldDamage.value) || 0,
      lootPool:        fields.lootPool,
      vendorInventory: fields.vendorInv,
      description:     fields.fldDesc.value.trim(),
      imageS:          fields.fldImgS.value.trim(),
      imageL:          fields.fldImgL.value.trim(),
      extraLines:      fields.extra.getLines().map(item => ({
                          text:  item.text.trim(),
                          color: item.color
                        }))
    };
  }

  // Form submission
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // Picker triggers
  fields.openLootPicker.addEventListener("click", () => openPicker("loot"));
  fields.openVendorPicker.addEventListener("click", () => openPicker("vend"));

  return { form, reset, populate };
}
