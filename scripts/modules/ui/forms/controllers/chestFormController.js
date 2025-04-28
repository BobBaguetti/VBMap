// @file:    /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 2.0 – aligned with itemFormController patterns

import { createPickr }            from "../../pickrManager.js";
import { getPickrHexColor }       from "../../../utils/colorUtils.js";
import { createChestForm }        from "../builders/chestFormBuilder.js";
import { createIcon }             from "../../../utils/iconUtils.js";
import { loadItemDefinitions }    from "../../../services/itemDefinitionsService.js";

import { createModal, openModal, closeModal } from "../../uiKit.js";

/**
 * Chest-definition form controller: provides reset / populate / getCustom and
 * wires pickrs, loot-pool picker modal, and header buttons exactly like
 * itemFormController.
 */
export function createChestFormController({ onCancel, onSubmit, onDelete }, db) {
  const { form, fields } = createChestForm();
  const pickrs = {};
  let _id = null; // current doc id or null (Add mode)

  // ───────────────────────── Header + Buttons ─────────────────────────
  const subheadingWrap = document.createElement("div");
  Object.assign(subheadingWrap.style, {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center"
  });

  const subheading = document.createElement("h3");
  subheading.textContent = "Add Chest Type";
  subheadingWrap.appendChild(subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type      = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type      = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick   = () => {
    reset();
    onCancel?.();
  };

  const btnDelete = document.createElement("button");
  btnDelete.type        = "button";
  btnDelete.className   = "ui-button-delete";
  btnDelete.title       = "Delete this chest type";
  btnDelete.style.width = "28px";
  btnDelete.style.height= "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none";
  btnDelete.onclick = () => {
    if (_id && confirm("Delete this chest type?")) {
      onDelete?.(_id);
    }
  };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  form.prepend(subheadingWrap);

  // ────────────────────── Description colour Pickr ────────────────────
  function initPickrs() {
    if (pickrs.desc || !document.body.contains(fields.colorDesc)) return;

    pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
    const reDispatch = () =>
      form.dispatchEvent(new Event("input", { bubbles: true }));
    pickrs.desc.on("change", reDispatch).on("save", reDispatch);
    fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
  }
  initPickrs();

  // ───────────────────────── Loot-pool picker ─────────────────────────
  let pickerModal, pickerContent, pickerSearch, pickerList, pickerSave, pickerCancel;
  let allItems = [];

  async function buildLootPicker() {
    if (pickerModal) return;

    const { modal, header, content } = createModal({
      id:          "chest-loot-picker",
      title:       "Select Loot Pool Items",
      size:        "small",
      backdrop:    true,
      withDivider: true,
      onClose:     () => closeModal(modal)
    });

    pickerModal   = modal;
    pickerContent = content;

    // search
    pickerSearch = document.createElement("input");
    pickerSearch.type = "text";
    pickerSearch.placeholder = "Search…";
    header.appendChild(pickerSearch);

    // list
    pickerList = document.createElement("div");
    Object.assign(pickerList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin:    "8px 0"
    });
    pickerContent.appendChild(pickerList);

    // buttons
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    pickerCancel = document.createElement("button");
    pickerCancel.type      = "button";
    pickerCancel.className = "ui-button";
    pickerCancel.textContent = "Cancel";
    pickerSave   = document.createElement("button");
    pickerSave.type      = "button";
    pickerSave.className = "ui-button";
    pickerSave.textContent = "Save";
    btnRow.append(pickerCancel, pickerSave);
    pickerContent.appendChild(btnRow);

    pickerSearch.addEventListener("input", filterPickerList);
    pickerCancel.onclick = () => closeModal(pickerModal);
    pickerSave.onclick   = savePicker;
  }

  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  async function openLootPicker() {
    await buildLootPicker();
    await ensureItems();
    // rebuild list each open
    pickerList.innerHTML = "";
    allItems.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display:     "flex",
        alignItems:  "center",
        padding:     "4px 0"
      });

      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.value   = item.id;
      cb.checked = fields.lootPool.includes(item.id);
      cb.style.marginRight = "8px";

      const lbl = document.createElement("label");
      lbl.textContent = item.name;

      row.append(cb, lbl);
      pickerList.appendChild(row);
    });

    pickerSearch.value = "";
    filterPickerList();
    openModal(pickerModal);
  }

  function filterPickerList() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.childNodes.forEach(row => {
      const lbl = row.querySelector("label").textContent.toLowerCase();
      row.style.display = lbl.includes(q) ? "" : "none";
    });
  }

  function savePicker() {
    const selected = Array.from(
      pickerList.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => cb.value);

    fields.lootPool.splice(0, fields.lootPool.length, ...selected);
    renderChips();
    closeModal(pickerModal);
  }

  function renderChips() {
    const container = fields.chipContainer;
    container.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;

      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
        renderChips();
      };

      chip.append(x);
      container.append(chip);
    });
  }

  fields.openLootPicker.onclick = openLootPicker;

  // ───────────────────────────── Reset / Populate ─────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
    subheading.textContent  = "Add Chest Type";
    btnDelete.style.display = "none";
    btnClear.textContent    = "Clear";
    initPickrs();
    pickrs.desc && pickrs.desc.setColor("#E5E6E8");
    fields.extraInfo.setLines([], false);
  }

  function populate(def) {
    form.reset();
    _id = def.id || null;

    fields.fldName.value    = def.name     || "";
    fields.fldIconUrl.value = def.iconUrl  || "";
    fields.fldSubtext.value = def.subtext  || "";
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool||[]));
    renderChips();
    fields.fldDesc.value    = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);

    subheading.textContent  = "Edit Chest Type";
    btnDelete.style.display = "";
    btnClear.textContent    = "Cancel";

    initPickrs();
    def.descriptionColor && pickrs.desc && pickrs.desc.setColor(def.descriptionColor);
  }

  // ─────────────────────────── getCustom helper ──────────────────────
  function getCustom() {
    initPickrs();
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      iconUrl:          fields.fldIconUrl.value.trim(),
      subtext:          fields.fldSubtext.value.trim(),
      lootPool:         [...fields.lootPool],
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.desc),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  // ─────────────────────────── form submit hook ──────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
  });

  // public API
  return { form, reset, populate, getCustom, initPickrs };
}
