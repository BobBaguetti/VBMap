// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 15 – now supports “Chest” alongside “Item”

import {
  createModal,
  closeModal,
  openModalAt,
  createDropdownField,
  createFormButtonRow
} from "../uiKit.js";

import { loadItemDefinitions }  from "../../services/itemDefinitionsService.js";
import { loadChestTypes }       from "../../services/chestTypesService.js";
import { createMarkerForm }     from "../forms/markerForm.js";

export function initMarkerModal(db) {
  let modal, content, form;
  let fldType, fldPredefItem, fldChestType;
  let blockItem, rowPredefItem, rowChestType;
  let formApi, rowButtons;
  let itemDefs = {};
  let chestDefs = {};

  // --- load and populate Item definitions ---
  async function refreshPredefinedItems() {
    if (!fldPredefItem) return;
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredefItem.innerHTML = `<option value="">None (custom)</option>`;
    for (const d of list) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldPredefItem.appendChild(o);
    }
  }

  // --- load and populate ChestType definitions ---
  async function refreshChestTypes() {
    if (!fldChestType) return;
    const list = await loadChestTypes(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldChestType.innerHTML = `<option value="">Select Chest Type</option>`;
    for (const d of list) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldChestType.appendChild(o);
    }
  }

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

    // form container
    form = document.createElement("form");
    form.id = "edit-form";

    // — Type dropdown —
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
    fldType = selectType;

    // — Predefined Item dropdown —
    const { row: rowPredef1, select: selectPredef1 } = createDropdownField(
      "Item:", "fld-predef-item", [], { showColor: false }
    );
    rowPredefItem  = rowPredef1;
    fldPredefItem  = selectPredef1;

    // — Chest Type dropdown —
    const { row: rowChest1, select: selectChest1 } = createDropdownField(
      "Chest Type:", "fld-predef-chest", [], { showColor: false }
    );
    rowChestType   = rowChest1;
    fldChestType   = selectChest1;

    // — Item‐specific fields —
    formApi    = createMarkerForm();
    blockItem  = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // — Buttons row —
    rowButtons = createFormButtonRow();
    const cancelBtn = rowButtons.querySelector('button[type="button"]');
    cancelBtn.onclick = e => { e.preventDefault(); closeModal(modal); };

    // assemble form order
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

    // — Show/hide sections when type changes —
    fldType.onchange = () => {
      const t = fldType.value;
      const isItem  = t === "Item";
      const isChest = t === "Chest";

      rowPredefItem.style.display = isItem  ? "flex" : "none";
      blockItem.style.display     = isItem  ? "block": "none";
      rowChestType.style.display  = isChest ? "flex" : "none";
    };

    // — When predefined item changes, fill in formApi from that def —
    fldPredefItem.onchange = () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // initial loads
    refreshPredefinedItems();
    refreshChestTypes();
  }

  // Opens for editing an existing marker
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // pre-populate
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
      formApi.setFromDefinition({});  // clear other fields
    }

    openModalAt(modal, evt);

    form.onsubmit = e => {
      e.preventDefault();
      const coords = data.coords;
      let out;
      if (fldType.value === "Item" && fldPredefItem.value) {
        // harvest via existing formApi
        out = { type:"Item", coords, predefinedItemId: fldPredefItem.value };
      } else if (fldType.value === "Chest" && fldChestType.value) {
        out = { type:"Chest", coords, chestTypeId: fldChestType.value };
      } else {
        // generic custom
        out = Object.assign({ coords, type: fldType.value }, formApi.getCustom());
      }
      onSave(markerObj, out, evt);
      closeModal(modal);
    };
  }

  // Opens for creating a new marker
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
