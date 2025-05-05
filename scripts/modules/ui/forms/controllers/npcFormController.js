// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 2.0

import { createPickr }          from "../../pickrManager.js";
import { getPickrHexColor }     from "../../../utils/colorUtils.js";
import { createNpcForm }        from "../builders/npcFormBuilder.js";
import { loadItemDefinitions }  from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal } from "../../uiKit.js";

/**
 * Controller for the NPC form.
 * Handles colour pickers, loot/vendor selectors, populate/reset helpers,
 * and submit/delete callbacks wired in by the modal.
 *
 * @param {{ onCancel?:Function, onSubmit?:Function, onDelete?:Function }} cb
 * @param {import('firebase/firestore').Firestore} db
 * @returns {{ form:HTMLFormElement, reset:Function, populate:Function, getCurrent:Function, getId:Function }}
 */
export function createNpcFormController(cb, db) {
  const { form, fields } = createNpcForm();
  const pickrs = {};
  let _id      = null;
  let allItems = [];

  /* ───────────────────────────────── Pickr helpers ────── */
  function initPickrs() {
    const attach = (btn, key) => {
      if (pickrs[key] || !document.body.contains(btn)) return;
      pickrs[key] = createPickr(`#${btn.id}`);
      const redispatch = () => form.dispatchEvent(new Event("input", { bubbles: true }));
      pickrs[key].on("change", redispatch).on("save", redispatch);
      btn.addEventListener("click", () => pickrs[key].show());
    };
    attach(fields.swName, "name");
    attach(fields.swHP,   "hp");
    attach(fields.swDMG,  "dmg");
    attach(fields.swDesc, "desc");
  }
  initPickrs();

  /* ──────────────────────────────── Item definitions ──── */
  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  /* ───────────── shared picker modal for loot & vendor ── */
  let pickerModal, pickerList, pickerSearch, pickerMode;
  async function buildPicker() {
    if (pickerModal) return;

    const { modal, header, content } = createModal({
      id:       "npc-item-picker",
      title:    "Select items",
      size:     "small",
      backdrop: true,
      onClose:  () => closeModal(modal)
    });
    pickerModal = modal;

    pickerSearch = Object.assign(document.createElement("input"), {
      type: "text",
      placeholder: "Search…"
    });
    header.appendChild(pickerSearch);

    pickerList = Object.assign(document.createElement("div"), {
      style: "max-height:200px;overflow-y:auto;margin:8px 0"
    });
    content.appendChild(pickerList);

    const btnRow = Object.assign(document.createElement("div"), { style: "text-align:right" });
    const cancel = Object.assign(document.createElement("button"), { className: "ui-button", type: "button", textContent: "Cancel" });
    const save   = Object.assign(document.createElement("button"), { className: "ui-button", type: "button", textContent: "Save" });
    cancel.onclick = () => closeModal(pickerModal);
    save.onclick   = saveSelection;
    btnRow.append(cancel, save);
    content.appendChild(btnRow);

    pickerSearch.addEventListener("input", filterPicker);
  }

  function filterPicker() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  async function openPicker(mode /* 'loot' | 'vend' */) {
    pickerMode = mode;
    await buildPicker();
    await ensureItems();

    const selected = mode === "loot" ? fields.lootPool : fields.vendInv;
    pickerList.innerHTML = "";

    allItems.forEach(def => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";

      const cb  = Object.assign(document.createElement("input"), {
        type: "checkbox",
        value: def.id,
        checked: selected.includes(def.id),
        style: "margin-right:8px"
      });
      const lab = Object.assign(document.createElement("label"), { textContent: def.name });
      row.append(cb, lab);
      pickerList.appendChild(row);
    });

    pickerSearch.value = "";
    filterPicker();

    pickerModal.querySelector("h2").textContent =
      mode === "loot" ? "Select Loot Pool Items" : "Select Vendor Stock Items";
    openModal(pickerModal);
  }

  function saveSelection() {
    const ids = Array.from(pickerList.querySelectorAll("input:checked")).map(n => n.value);
    if (pickerMode === "loot") {
      fields.lootPool.splice(0, fields.lootPool.length, ...ids);
      renderChips("loot");
    } else {
      fields.vendInv.splice(0, fields.vendInv.length, ...ids);
      renderChips("vend");
    }
    closeModal(pickerModal);
  }

  function renderChips(which /* loot | vend */) {
    const container = which === "loot" ? fields.lootChips : fields.vendChips;
    const ids       = which === "loot" ? fields.lootPool  : fields.vendInv;
    container.innerHTML = "";

    ids.forEach(id => {
      const item = allItems.find(i => i.id === id) || { name: id };
      const chip = Object.assign(document.createElement("span"), { className: "loot-pool-chip", textContent: item.name });
      const x = Object.assign(document.createElement("span"), { className: "remove-chip", textContent: "×" });
      x.onclick = () => {
        ids.splice(ids.indexOf(id), 1);
        renderChips(which);
      };
      chip.appendChild(x);
      container.appendChild(chip);
    });
  }

  fields.btnLoot.onclick = () => openPicker("loot");
  fields.btnVend.onclick = () => openPicker("vend");

  /* ─────────────────────────────── form helpers ───────── */
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    fields.vendInv.length  = 0;
    renderChips("loot");
    renderChips("vend");

    fields.roleCheckboxes.forEach(cb => (cb.checked = false));
    initPickrs();
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
    fields.extraInfo.setLines([], false);
  }

  function populate(def) {
    reset(); // clears all fields first
    _id = def.id || null;

    fields.fldName.value     = def.name               || "";
    fields.fldHealth.value   = def.health             ?? "";
    fields.fldDamage.value   = def.damage             ?? "";
    fields.fldImgSmall.value = def.imageSmallUrl      || "";
    fields.fldImgLarge.value = def.imageLargeUrl      || "";

    /* roles */
    fields.roleCheckboxes.forEach(cb => {
      cb.checked = Array.isArray(def.roles) && def.roles.includes(cb.value);
    });

    /* inventories */
    fields.lootPool.splice(0, 0, ...(def.lootPool       || []));
    fields.vendInv.splice(0, 0, ...(def.vendorInventory || []));
    renderChips("loot");
    renderChips("vend");

    /* colours */
    def.nameColor        && pickrs.name?.setColor(  def.nameColor );
    def.healthColor      && pickrs.hp?.setColor(    def.healthColor );
    def.damageColor      && pickrs.dmg?.setColor(   def.damageColor );
    def.descriptionColor && pickrs.desc?.setColor(  def.descriptionColor );

    /* description & extras */
    fields.fldDesc.value = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);
  }

  function getCurrent() {
    initPickrs();
    return {
      id: _id,

      name:          fields.fldName.value.trim(),
      health:        Number(fields.fldHealth.value) || 0,
      damage:        Number(fields.fldDamage.value) || 0,
      roles:         fields.roleCheckboxes.filter(cb => cb.checked).map(cb => cb.value),

      imageSmallUrl: fields.fldImgSmall.value.trim(),
      imageLargeUrl: fields.fldImgLarge.value.trim(),

      lootPool:        [...fields.lootPool],
      vendorInventory: [...fields.vendInv],

      nameColor:   getPickrHexColor(pickrs.name),
      healthColor: getPickrHexColor(pickrs.hp),
      damageColor: getPickrHexColor(pickrs.dmg),

      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.desc),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  /* ─────────────────────────── event wiring ───────────── */
  form.addEventListener("submit", e => {
    e.preventDefault();
    cb?.onSubmit?.(getCurrent());
  });

  return { form, reset, populate, getCurrent, getId: () => _id };
}
