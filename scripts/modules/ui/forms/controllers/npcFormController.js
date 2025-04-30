// @version: 1.2
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createPickr }         from "../../ui/pickrManager.js";
import { getPickrHexColor }    from "../../../utils/colorUtils.js";
import { createNpcForm }       from "../builders/npcFormBuilder.js";
import { createIcon }          from "../../../utils/iconUtils.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../ui/uiKit.js";

export function createNpcFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createNpcForm();
  const pickrs = {};
  let _id = null,

      // picker state
      lootPickerModal = null,
      lootPickerContent,
      lootSearch,
      lootList,
      vendorPickerModal = null,
      vendorPickerContent,
      vendorSearch,
      vendorList,
      allItems = [];

  // ─── Header + Buttons ─────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "floating-buttons";
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

  // ─── Pickr for future color fields (if any) ───────────────────────
  function initPickrs() {
    if (pickrs.desc || !document.body.contains(fields.extraInfoBlock.block)) return;
    // Example: you could hook up a pickr here if you add color swatches to extraInfoBlock
  }

  // ─── Common ensureAllItems ────────────────────────────────────────
  async function ensureAllItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  // ─── Build & Open Loot-Pool Picker ───────────────────────────────
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

    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "ui-button"; cancel.textContent = "Cancel";
    cancel.onclick = () => closeModal(modal);
    const save   = document.createElement("button");
    save.type    = "button"; save.className = "ui-button"; save.textContent = "Save";
    save.onclick = saveLootPicker;
    btnRow.append(cancel, save);
    content.append(btnRow);

    lootSearch.addEventListener("input", filterLootList);
  }

  function filterLootList() {
    const q = lootSearch.value.toLowerCase();
    lootList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  async function openLootPicker() {
    await buildLootPicker();
    await ensureAllItems();
    lootList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, { display:"flex", alignItems:"center", padding:"4px 0" });
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = item.id;
      cb.checked = fields.lootPoolBlock.extraInfo.getLines().some(l => l.id === item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      lootList.appendChild(row);
    });
    lootSearch.value = ""; filterLootList();
    openModal(lootPickerModal);
  }

  function saveLootPicker() {
    const selected = Array.from(
      lootList.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => {
      const def = allItems.find(i => i.id === cb.value);
      return def ? { text:def.name, color:"#ccc", id:def.id } : null;
    }).filter(Boolean);
    fields.lootPoolBlock.extraInfo.setLines(selected, false);
    closeModal(lootPickerModal);
  }

  // ─── Build & Open Vendor-Inventory Picker ────────────────────────
  async function buildVendorPicker() {
    if (vendorPickerModal) return;
    const { modal, header, content } = createModal({
      id: "npc-vendor-picker",
      title: "Select Vendor Inventory Items",
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

    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "ui-button"; cancel.textContent = "Cancel";
    cancel.onclick = () => closeModal(modal);
    const save   = document.createElement("button");
    save.type    = "button"; save.className = "ui-button"; save.textContent = "Save";
    save.onclick = saveVendorPicker;
    btnRow.append(cancel, save);
    content.append(btnRow);

    vendorSearch.addEventListener("input", filterVendorList);
  }

  function filterVendorList() {
    const q = vendorSearch.value.toLowerCase();
    vendorList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  async function openVendorPicker() {
    await buildVendorPicker();
    await ensureAllItems();
    vendorList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, { display:"flex", alignItems:"center", padding:"4px 0" });
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = item.id;
      cb.checked = fields.vendorInvBlock.extraInfo.getLines().some(l => l.id === item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      vendorList.appendChild(row);
    });
    vendorSearch.value = ""; filterVendorList();
    openModal(vendorPickerModal);
  }

  function saveVendorPicker() {
    const selected = Array.from(
      vendorList.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => {
      const def = allItems.find(i => i.id === cb.value);
      return def ? { text:def.name, color:"#ccc", id:def.id } : null;
    }).filter(Boolean);
    fields.vendorInvBlock.extraInfo.setLines(selected, false);
    closeModal(vendorPickerModal);
  }

  // ─── Reset / Populate / getCustom ─────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    titleEl.textContent = "Add NPC";
    btnDelete.style.display = "none";

    fields.lootPoolBlock.extraInfo.setLines([], false);
    fields.vendorInvBlock.extraInfo.setLines([], false);
    fields.extraInfoBlock.extraInfo.setLines([], false);
    fields.fldTypeFlags.forEach(cb => cb.checked = false);
  }

  function populate(def={}) {
    _id = def.id || null;
    titleEl.textContent = _id ? "Edit NPC" : "Add NPC";
    btnDelete.style.display = _id ? "" : "none";

    fields.fldName.value    = def.name       || "";
    fields.fldHealth.value  = def.health     ?? "";
    fields.fldDamage.value  = def.damage     ?? "";
    fields.fldTypeFlags.forEach(cb => cb.checked = (def.typeFlags||[]).includes(cb.value));

    fields.lootPoolBlock.extraInfo.setLines(def.lootPool || [], false);
    fields.vendorInvBlock.extraInfo.setLines(def.vendorInventory || [], false);
    fields.extraInfoBlock.extraInfo.setLines(def.extraLines || [], false);
  }

  // ─── Gather form values ───────────────────────────────────────────
  function getCustom() {
    return {
      id:              _id,
      name:            fields.fldName.value.trim(),
      typeFlags:       fields.fldTypeFlags.filter(cb=>cb.checked).map(cb=>cb.value),
      health:          Number(fields.fldHealth.value) || 0,
      damage:          Number(fields.fldDamage.value) || 0,
      lootPool:        fields.lootPoolBlock.extraInfo.getLines(),
      vendorInventory: fields.vendorInvBlock.extraInfo.getLines(),
      extraLines:      fields.extraInfoBlock.extraInfo.getLines()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
    reset();
  });

  // ─── Wire up our two pickers ─────────────────────────────────────
  fields.lootPoolBlock.block
    .querySelector("button")
    .addEventListener("click", openLootPicker);

  fields.vendorInvBlock.block
    .querySelector("button")
    .addEventListener("click", openVendorPicker);

  return { form, reset, populate };
}
