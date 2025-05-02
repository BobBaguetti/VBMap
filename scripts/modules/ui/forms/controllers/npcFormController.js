// @version: 2.7
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
  let lootModal, vendModal;
  let lootSearch, lootList, vendSearch, vendList;

  // ensure we've loaded item defs
  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  // build (or return) one of our two pickers
  function buildPicker(type) {
    const isLoot = type === "loot";
    let mRef = isLoot ? lootModal : vendModal;
    if (mRef) return mRef;

    const { modal, header, content } = createModal({
      id: `npc-${type}-picker`,
      title: isLoot ? "Select Loot Pool Items" : "Select Vendor Inventory",
      size: "small", backdrop: true, withDivider: true,
      onClose: () => closeModal(modal)
    });

    // search box
    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search…";
    header.appendChild(search);

    // list container
    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(list);

    // buttons
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

    // wire filtering
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

  // open + populate picker
  async function openPicker(type) {
    await ensureItems();
    buildPicker(type);

    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    list.innerHTML = "";

    // currently selected IDs
    const selectedIDs = (type === "loot"
      ? fields.lootPool
      : fields.vendorInv
    );

    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex", alignItems: "center", padding: "4px 0"
      });

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
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

  // filter the list
  function filterPicker(type) {
    const search = type === "loot" ? lootSearch : vendSearch;
    const list   = type === "loot" ? lootList   : vendList;
    const q = search.value.toLowerCase();
    Array.from(list.children).forEach(r => {
      const txt = r.querySelector("label").textContent.toLowerCase();
      r.style.display = txt.includes(q) ? "" : "none";
    });
  }

  // save selections
  function savePicker(type) {
    const list = type === "loot" ? lootList : vendList;
    const lines = Array.from(list.querySelectorAll("input:checked"))
      .map(cb => {
        return {
          id: cb.value,
          text: allItems.find(i => i.id === cb.value).name,
          color: "#ccc"
        };
      });

    if (type === "loot") {
      fields.lootPool = lines.map(l => l.id);
      fields.chipContainerLoot.innerHTML = "";
      lines.forEach(l => {
        const chip = document.createElement("span");
        chip.className = "loot-pool-chip";
        chip.textContent = l.text;
        const x = document.createElement("span");
        x.className = "remove-chip";
        x.textContent = "×";
        x.onclick = () => {
          fields.lootPool = fields.lootPool.filter(id => id !== l.id);
          chip.remove();
        };
        chip.append(x);
        fields.chipContainerLoot.append(chip);
      });
      closeModal(lootModal);
    } else {
      fields.vendorInv = lines.map(l => l.id);
      fields.chipContainerVend.innerHTML = "";
      lines.forEach(l => {
        const chip = document.createElement("span");
        chip.className = "loot-pool-chip";
        chip.textContent = l.text;
        const x = document.createElement("span");
        x.className = "remove-chip";
        x.textContent = "×";
        x.onclick = () => {
          fields.vendorInv = fields.vendorInv.filter(id => id !== l.id);
          chip.remove();
        };
        chip.append(x);
        fields.chipContainerVend.append(chip);
      });
      closeModal(vendModal);
    }
  }

  // Reset form
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool = [];
    fields.vendorInv = [];
    fields.chipContainerLoot.innerHTML = "";
    fields.chipContainerVend.innerHTML = "";
    fields.fldDesc.value = "";
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  // Populate for edit
  function populate(def = {}) {
    _id = def.id || null;
    form.querySelector("h3").textContent = _id ? "Edit NPC" : "Add NPC";

    fields.fldName.value   = def.name           || "";
    fields.fldHealth.value = def.health         ?? "";
    fields.fldDamage.value = def.damage         ?? "";
    fields.fldDesc.value   = def.description    || "";
    fields.fldTypeFlags.forEach(cb => {
      cb.checked = Array.isArray(def.typeFlags)
        && def.typeFlags.includes(cb.value);
    });

    // re-render loot chips
    if (def.lootPool) {
      fields.lootPool = def.lootPool.map(l => l.id);
      fields.chipContainerLoot.innerHTML = "";
      def.lootPool.forEach(l => {
        const chip = document.createElement("span");
        chip.className = "loot-pool-chip";
        chip.textContent = l.text;
        fields.chipContainerLoot.append(chip);
      });
    }

    // re-render vendor chips
    if (def.vendorInventory) {
      fields.vendorInv = def.vendorInventory.map(i => i.id);
      fields.chipContainerVend.innerHTML = "";
      def.vendorInventory.forEach(i => {
        const chip = document.createElement("span");
        chip.className = "loot-pool-chip";
        chip.textContent = i.text;
        fields.chipContainerVend.append(chip);
      });
    }
  }

  // Gather final payload
  function getCustom() {
    return {
      id:              _id,
      name:            fields.fldName.value.trim(),
      typeFlags:       fields.fldTypeFlags.filter(cb => cb.checked).map(cb => cb.value),
      health:          Number(fields.fldHealth.value) || 0,
      damage:          Number(fields.fldDamage.value) || 0,
      lootPool:        fields.lootPool,
      vendorInventory: fields.vendorInv,
      description:     fields.fldDesc.value.trim()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // Wire up the two pickers
  fields.openLootPicker .addEventListener("click", () => openPicker("loot"));
  fields.openVendorPicker.addEventListener("click", () => openPicker("vend"));

  return { form, reset, populate };
}
