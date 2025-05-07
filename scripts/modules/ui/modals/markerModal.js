// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 20.3 – point chest dropdown at chestDefinitionsService.js 

import {
  createModal,
  closeModal,
  openModalAt,
  createDropdownField,
  createFormButtonRow
} from "../uiKit.js";
import { loadItemDefinitions }      from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions }     from "../../services/chestDefinitionsService.js";
import { createMarkerForm }         from "../forms/markerForm.js";

export function initMarkerModal(db) {
  let modal, content, form;
  let fldType, fldPredefItem, fldChestType;
  let rowPredefItem, rowChestType, blockItem;
  let formApi, rowButtons;
  let itemDefs = {}, chestDefs = {};

  // ─── Helpers to load & cache definitions ────────────────────────
  async function refreshPredefinedItems() {
    if (!fldPredefItem) return;
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredefItem.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldPredefItem.appendChild(o);
    });
  }

  async function refreshChestTypes() {
    if (!fldChestType) return;
    const list = await loadChestDefinitions(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldChestType.innerHTML = `<option value="">Select Chest Type</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldChestType.appendChild(o);
    });
  }

  // ─── Build the modal structure once ────────────────────────────
  function ensureBuilt() {
    if (modal) return;

    const created = createModal({
      id:         "edit-marker-modal",
      title:      "Edit Marker",
      size:       "small",
      backdrop:   false,
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = created.modal;
    content = created.content;
    modal.classList.add("admin-only");

    // form element
    form = document.createElement("form");
    form.id = "edit-form";

    // ─ Type dropdown ───────────────────────────────────────────────
    const { row: rowType, select: selectType } = createDropdownField(
      "Type:", "fld-type",
      [
        { value: "Door",               label: "Door" },
        { value: "Extraction Portal",  label: "Extraction Portal" },
        { value: "Item",               label: "Item" },
        { value: "Chest",              label: "Chest" },
        { value: "Teleport",           label: "Teleport" },
        { value: "Spawn Point",        label: "Spawn Point" }
      ],
      { showColor: false }
    );
    // insert “Select type…” placeholder
    selectType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
    ` + selectType.innerHTML;
    fldType = selectType;

    // ─ Predefined Item dropdown ────────────────────────────────────
    ({ row: rowPredefItem, select: fldPredefItem } = createDropdownField(
      "Item:", "fld-predef-item", [], { showColor: false }
    ));

    // ─ Chest Type dropdown ─────────────────────────────────────────
    ({ row: rowChestType, select: fldChestType } = createDropdownField(
      "Chest Type:", "fld-predef-chest", [], { showColor: false }
    ));

    // ─ Item-specific fields ────────────────────────────────────────
    formApi = createMarkerForm();
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    // Reordered: Item Type first, then Rarity, then Description
    blockItem.append(
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // ─ Buttons row ────────────────────────────────────────────────
    rowButtons = createFormButtonRow();
    rowButtons.querySelector('button[type="button"]')
      .onclick = e => { e.preventDefault(); closeModal(modal); };

    // ─ assemble in order ──────────────────────────────────────────
    form.append(
      formApi.fields.fldName.closest(".field-row"),
      rowType,
      rowPredefItem,
      rowChestType,
      blockItem,
      formApi.fields.extraRow,
      formApi.fields.fldImgS.closest(".field-row"),
      formApi.fields.fldImgL.closest(".field-row"),
      formApi.fields.fldVid.closest(".field-row"),
      rowButtons
    );
    content.appendChild(form);

    // ─ Show/hide when Type changes ───────────────────────────────
    fldType.onchange = () => {
      const t = fldType.value;
      rowPredefItem.style.display = (t === "Item")  ? "flex" : "none";
      blockItem.style.display     = (t === "Item")  ? "block": "none";
      rowChestType.style.display  = (t === "Chest") ? "flex" : "none";
    };

    // ─ Populate formApi when picking a predefined Item ───────────
    fldPredefItem.onchange = () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // ─ initial loads ─────────────────────────────────────────────
    refreshPredefinedItems();
    refreshChestTypes();

    // seed pickrs so first Item-pick gets colors correctly
    formApi.setFromDefinition({});
    formApi.initPickrs();
  }

  // ─── Open for editing an existing marker ───────────────────────
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    fldPredefItem.value = "";
    fldChestType.value  = "";

    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));

    if (data.type === "Item" && data.predefinedItemId) {
      fldPredefItem.value = data.predefinedItemId;
      fldPredefItem.dispatchEvent(new Event("change"));
    }
    if (data.type === "Chest" && data.chestTypeId) {
      fldChestType.value = data.chestTypeId;
    }
    if (data.type !== "Item") {
      formApi.setFromDefinition({});
      formApi.initPickrs();
    }

    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(data.coords);
      onSave(markerObj, out, evt);
      closeModal(modal);
    };
  }

  // ─── Open for creating a new marker ────────────────────────────
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    fldPredefItem.value = "";
    fldChestType.value  = "";
    formApi.setFromDefinition({});
    formApi.initPickrs();

    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));

    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(coords);
      onCreate(out);
      closeModal(modal);
    };
  }

  // ─── Harvest form data ────────────────────────────────────────
  function harvest(coords) {
    const type = fldType.value;
    if (type === "Chest" && fldChestType.value) {
      return { type, coords, chestTypeId: fldChestType.value };
    }
    if (type === "Item" && fldPredefItem.value) {
      return {
        type,
        coords,
        predefinedItemId: fldPredefItem.value,
        ...formApi.getCustom()
      };
    }
    return { type, coords, ...formApi.getCustom() };
  }

  return { openEdit, openCreate };
}
