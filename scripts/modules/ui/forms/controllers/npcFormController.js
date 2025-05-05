// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 1.0 – fresh modular controller derived from chestFormController (2025‑05‑05)

import { createPickr }          from "../../pickrManager.js";
import { getPickrHexColor }     from "../../../utils/colorUtils.js";
import { createNpcForm }        from "../builders/npcFormBuilder.js";
import { createIcon }           from "../../../utils/iconUtils.js";
import { loadItemDefinitions }  from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

/**
 * NPC‑definition form controller.
 * Mirrors chestFormController patterns but includes:
 *   • Loot Pool **and** Vendor Stock pickers  
 *   • Role checkboxes, HP & Damage fields
 */
export function createNpcFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createNpcForm();
  const pickrs = {};
  let _id = null;
  let allItems = [];

  /* ── helpers ───────────────────────────────────────────── */
  async function ensureAllItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  /* ── Pickr ─────────────────────────────────────────────── */
  function initPickrs() {
    if (pickrs.desc || !document.body.contains(fields.colorDesc)) return;
    pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
    const redispatch = () =>
      form.dispatchEvent(new Event("input", { bubbles: true }));
    pickrs.desc.on("change", redispatch).on("save", redispatch);
    fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
  }
  initPickrs();

  /* ── dual inventory picker modal ───────────────────────── */
  let pickerModal, pickerContent, pickerSearch, pickerList, pickerMode;

  async function buildPicker() {
    if (pickerModal) return;
    const { modal, header, content } = createModal({
      id: "npc-item-picker",
      title: "Select items",
      size: "small",
      backdrop: true,
      withDivider: true,
      onClose: () => closeModal(modal)
    });
    pickerModal   = modal;
    pickerContent = content;

    pickerSearch = document.createElement("input");
    pickerSearch.type = "text";
    pickerSearch.placeholder = "Search…";
    header.appendChild(pickerSearch);

    pickerList = document.createElement("div");
    Object.assign(pickerList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    pickerContent.appendChild(pickerList);

    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "ui-button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => closeModal(pickerModal);
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ui-button";
    saveBtn.textContent = "Save";
    saveBtn.onclick = saveSelection;
    btnRow.append(cancelBtn, saveBtn);
    pickerContent.appendChild(btnRow);

    pickerSearch.addEventListener("input", filterList);
  }

  function filterList() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  async function openPicker(mode /* "loot" | "vend" */) {
    pickerMode = mode;
    await buildPicker();
    await ensureAllItems();
    pickerList.innerHTML = "";

    const selected = mode === "loot" ? fields.lootPool : fields.vendInventory;

    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        padding: "4px 0"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
      cb.checked = selected.includes(item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      pickerList.appendChild(row);
    });

    pickerSearch.value = "";
    filterList();
    pickerModal.querySelector("h2").textContent =
      mode === "loot" ? "Select Loot Pool Items" : "Select Vendor Stock Items";
    openModal(pickerModal);
  }

  function saveSelection() {
    const ids = Array.from(
      pickerList.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => cb.value);

    if (pickerMode === "loot") {
      fields.lootPool.splice(0, fields.lootPool.length, ...ids);
      renderChips("loot");
    } else {
      fields.vendInventory.splice(0, fields.vendInventory.length, ...ids);
      renderChips("vend");
    }
    closeModal(pickerModal);
  }

  function renderChips(mode) {
    const container =
      mode === "loot" ? fields.chipContainerLoot : fields.chipContainerVend;
    const ids = mode === "loot" ? fields.lootPool : fields.vendInventory;
    container.innerHTML = "";
    ids.forEach(id => {
      const def = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;
      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        const arr = mode === "loot" ? fields.lootPool : fields.vendInventory;
        arr.splice(arr.indexOf(id), 1);
        renderChips(mode);
      };
      chip.append(x);
      container.append(chip);
    });
  }

  fields.btnEditLoot.onclick = () => openPicker("loot");
  fields.btnEditVend.onclick = () => openPicker("vend");

  /* ── Reset / Populate / getCurrent ─────────────────────── */
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    fields.vendInventory.length = 0;
    renderChips("loot");
    renderChips("vend");
    fields.roleCheckboxes.forEach(cb => (cb.checked = false));
    initPickrs();
    pickrs.desc?.setColor("#E5E6E8");
    fields.extraInfo.setLines([], false);
  }

  function populate(def) {
    form.reset();
    _id = def.id || null;

    fields.fldName.value      = def.name    || "";
    fields.fldIcon.value      = def.iconUrl || "";
    fields.fldSubtext.value   = def.subtext || "";
    fields.fldHP.value        = def.health  ?? "";
    fields.fldDMG.value       = def.damage  ?? "";

    // roles
    fields.roleCheckboxes.forEach(cb => {
      cb.checked = Array.isArray(def.roles) && def.roles.includes(cb.value);
    });

    // inventories
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool || []));
    fields.vendInventory.splice(
      0,
      fields.vendInventory.length,
      ...(def.vendorInventory || [])
    );
    renderChips("loot");
    renderChips("vend");

    // description
    fields.fldDesc.value = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);
    initPickrs();
    def.descriptionColor && pickrs.desc.setColor(def.descriptionColor);
  }

  function getCurrent() {
    initPickrs();
    const roles = fields.roleCheckboxes
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    return {
      id: _id,
      name: fields.fldName.value.trim(),
      roles,
      health: Number(fields.fldHP.value) || 0,
      damage: Number(fields.fldDMG.value) || 0,
      iconUrl: fields.fldIcon.value.trim(),
      subtext: fields.fldSubtext.value.trim(),
      lootPool: [...fields.lootPool],
      vendorInventory: [...fields.vendInventory],
      description: fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.desc),
      extraLines: fields.extraInfo.getLines()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCurrent());
  });

  return { form, reset, populate, getCurrent, getId: () => _id };
}
