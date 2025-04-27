// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 15 – unified Chest + Item support, and fixed initial UI state

import {
  createModal,
  closeModal,
  openModalAt,
  createDropdownField,
  createFormButtonRow
} from "../uiKit.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { loadChestTypes }      from "../../services/chestTypesService.js";
import { createMarkerForm }    from "../forms/markerForm.js";

export function initMarkerModal(db) {
  let modal, content, form;
  let fldType, fldPredefItem, fldChestType;
  let rowPredefItem, rowChestType, blockItem;
  let formApi, rowButtons;
  let itemDefs = {}, chestDefs = {};

  // — Load & cache item defs —
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

  // — Load & cache chest‐type defs —
  async function refreshChestTypes() {
    if (!fldChestType) return;
    const list = await loadChestTypes(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldChestType.innerHTML = `<option value="">Select Chest Type</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldChestType.appendChild(o);
    });
  }

  // — Build the modal once —
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

    // form wrapper
    form = document.createElement("form");
    form.id = "edit-form";

    // 1) Type selector (now includes Chest)
    const { row: rowType, select: selectType } = createDropdownField(
      "Type:", "fld-type",
      [
        { value: "Door",              label: "Door" },
        { value: "Extraction Portal", label: "Extraction Portal" },
        { value: "Item",              label: "Item" },
        { value: "Chest",             label: "Chest" },
        { value: "Teleport",          label: "Teleport" },
        { value: "Spawn Point",       label: "Spawn Point" }
      ],
      { showColor: false }
    );
    fldType = selectType;

    // 2) Predefined Item dropdown
    const { row: rp, select: sp } = createDropdownField(
      "Item:", "fld-predef-item", [], { showColor: false }
    );
    rowPredefItem = rp;
    fldPredefItem = sp;

    // 3) Chest Type dropdown
    const { row: rc, select: sc } = createDropdownField(
      "Chest Type:", "fld-predef-chest", [], { showColor: false }
    );
    rowChestType = rc;
    fldChestType = sc;

    // 4) Item‐specific block (rarity, type, desc)
    formApi = createMarkerForm();
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // 5) Buttons row
    rowButtons = createFormButtonRow();
    rowButtons.querySelector('button[type="button"]')
      .onclick = e => { e.preventDefault(); closeModal(modal); };

    // assemble in order
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

    // 6) Show/hide on type change
    fldType.onchange = () => {
      const t = fldType.value;
      const isItem  = t === "Item";
      const isChest = t === "Chest";
      rowPredefItem.style.display = isItem  ? "flex" : "none";
      blockItem.style.display     = isItem  ? "block": "none";
      rowChestType.style.display  = isChest ? "flex" : "none";
    };

    // 7) When choosing an item, populate the form
    fldPredefItem.onchange = () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // initial load of dropdown data
    refreshPredefinedItems();
    refreshChestTypes();
  }

  // — Open for editing existing marker —
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    // load both sets
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // set type & trigger UI
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));

    // item case
    if (data.type === "Item" && data.predefinedItemId) {
      fldPredefItem.value = data.predefinedItemId;
      fldPredefItem.dispatchEvent(new Event("change"));
    }
    // chest case
    if (data.type === "Chest" && data.chestTypeId) {
      fldChestType.value = data.chestTypeId;
    }
    // clear item fields when not an Item
    if (data.type !== "Item") {
      formApi.setFromDefinition({});
    }

    openModalAt(modal, evt);

    form.onsubmit = e => {
      e.preventDefault();
      const coords = data.coords;
      let out;
      if (fldType.value === "Item" && fldPredefItem.value) {
        out = { type:"Item", coords, predefinedItemId: fldPredefItem.value };
      } else if (fldType.value === "Chest" && fldChestType.value) {
        out = { type:"Chest", coords, chestTypeId: fldChestType.value };
      } else {
        out = Object.assign({ coords, type: fldType.value }, formApi.getCustom());
      }
      onSave(markerObj, out, evt);
      closeModal(modal);
    };
  }

  // — Open for creating a new marker —
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    fldType.value = type;
    fldType.dispatchEvent(new Event("change"));

    // clear selects
    fldPredefItem.value = "";
    fldChestType.value  = "";

    openModalAt(modal, evt);

    form.onsubmit = e => {
      e.preventDefault();
      let out;
      if (type === "Item" && fldPredefItem.value) {
        out = { type:"Item", coords, predefinedItemId: fldPredefItem.value };
      } else if (type === "Chest" && fldChestType.value) {
        out = { type:"Chest", coords, chestTypeId: fldChestType.value };
      } else {
        out = Object.assign({ coords, type }, formApi.getCustom());
      }
      onCreate(out);
      closeModal(modal);
    };
  }

  return { openEdit, openCreate };
}
