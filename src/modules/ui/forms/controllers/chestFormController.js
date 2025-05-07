// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.10 — Pickr wiring via shared formPickrManager

import { getPickrHexColor }                          from "../../../utils/colorUtils.js";
import { createChestForm }                           from "../builders/chestFormBuilder.js";
import { createIcon }                                from "../../../utils/iconUtils.js";
import { loadItemDefinitions }                       from "../../../services/itemDefinitionsService.js";
import { createModal, openModal, closeModal }        from "../../uiKit.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                                    from "../../components/formControllerShell.js";
import { initFormPickrs }                            from "../../components/formPickrManager.js";

/**
 * Chest-definition form controller.
 *
 * @param {object} callbacks
 * @param {function} callbacks.onCancel
 * @param {function} callbacks.onSubmit
 * @param {function} callbacks.onDelete
 * @param {function} [callbacks.onFieldChange]
 */
export function createChestFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createChestForm();

  // ─── Shared header + buttons ───────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    setDeleteVisible
  } = createFormControllerHeader({
    title:    "Add Chest Type",
    hasFilter:false,
    onCancel: () => {
      reset();
      onCancel?.();
    },
    onDelete: () => {
      if (_id && confirm("Delete this chest type?")) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Shared Pickr wiring ───────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    description: fields.colorDesc
  });

  // ─── Loot-pool picker setup ────────────────────────────────────────
  let pickerModal, pickerContent, pickerSearch, pickerList;
  let itemMap = [];

  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
    }
  }

  function filterList() {
    const q = pickerSearch.value.toLowerCase();
    pickerList.childNodes.forEach(row => {
      const txt = row.querySelector("label").textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  }

  async function buildPicker() {
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

    pickerSearch = document.createElement("input");
    pickerSearch.type = "text";
    pickerSearch.placeholder = "Search…";
    header.appendChild(pickerSearch);

    pickerList = document.createElement("div");
    Object.assign(pickerList.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin:    "8px 0"
    });
    pickerContent.appendChild(pickerList);

    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    const cancel = document.createElement("button");
    cancel.type        = "button";
    cancel.className   = "ui-button";
    cancel.textContent = "Cancel";
    cancel.onclick     = () => closeModal(pickerModal);
    const save = document.createElement("button");
    save.type        = "button";
    save.className   = "ui-button";
    save.textContent = "Save";
    save.onclick     = savePicker;
    btnRow.append(cancel, save);
    pickerContent.appendChild(btnRow);

    pickerSearch.addEventListener("input", filterList);
  }

  async function openPicker() {
    await buildPicker();
    await ensureAllItems();
    pickerList.innerHTML = "";
    itemMap.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display:    "flex",
        alignItems: "center",
        padding:    "4px 0"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.id;
      cb.checked = fields.lootPool.includes(item.id);
      cb.style.marginRight = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = item.name;
      row.append(cb, lbl);
      pickerList.appendChild(row);
    });
    pickerSearch.value = "";
    filterList();
    openModal(pickerModal);
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
    fields.chipContainer.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = itemMap.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;
      const x = document.createElement("span");
      x.className   = "remove-chip";
      x.textContent = "×";
      x.onclick     = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
        renderChips();
      };
      chip.append(x);
      fields.chipContainer.append(chip);
    });
  }

  fields.openLootPicker.onclick = openPicker;

  // ─── Reset / Populate / Get Custom Payload ─────────────────────────
  let _id = null;

  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
    fields.fldSize.value     = "Small";
    fields.fldCategory.value = "Normal";
    subheading.textContent   = "Add Chest Type";
    setDeleteVisible(false);
    pickrs.description?.setColor("#E5E6E8");
    fields.extraInfo.setLines([], false);
    onFieldChange?.(getCustom());
  }

  function populate(def) {
    form.reset();
    _id = def.id || null;
    fields.fldName.value        = def.name    || "";
    fields.fldSize.value        = def.size    || "Small";
    fields.fldCategory.value    = def.category|| "Normal";
    fields.fldIconUrl.value     = def.iconUrl || "";
    fields.fldSubtext.value     = def.subtext || "";
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool||[]));
    renderChips();
    fields.fldDesc.value        = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);
    subheading.textContent      = "Edit Chest Type";
    setDeleteVisible(true);
    pickrs.description?.setColor(def.descriptionColor);
    onFieldChange?.(getCustom());
  }

  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      size:             fields.fldSize.value,
      category:         fields.fldCategory.value,
      iconUrl:          fields.fldIconUrl.value.trim(),
      subtext:          fields.fldSubtext.value.trim(),
      lootPool:         [...fields.lootPool],
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  // ─── Wire form submission & live‐preview hooks ───────────────────
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getCustom,
    getCurrentPayload: getCustom
  };
}
