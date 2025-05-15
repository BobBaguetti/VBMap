// @file: src/modules/ui/modals/markerModal.js
// @version: 21.4 — small modal without backdrop dimming

import {
  createModal,
  closeModal,
  openModalAt
} from "../components/uiKit/modalKit.js";
import {
  createDropdownField,
  createFormButtonRow
} from "../components/uiKit/fieldKit.js";
import { loadItemDefinitions }  from "../../services/definitions/itemService.js";
import { loadChestDefinitions } from "../../services/definitions/chestService.js";
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, content, ctrl;
  let fldType, fldPredefItem, fldChestType;
  let rowType, rowPredefItem, rowChestType;
  let itemDefs = {}, chestDefs = {};

  async function refreshPredefinedItems() {
    if (!fldPredefItem) return;
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredefItem.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldPredefItem.append(o);
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
      fldChestType.append(o);
    });
  }

  function ensureBuilt() {
    if (modal) return;

    // create the modal shell
    const m = createModal({
      id:         "marker-modal",
      title:      "Marker",
      size:       "small",
      backdrop:   false,      // no dimming behind small modals
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = m.modal;
    content = m.content;
    modal.classList.add("admin-only");

    // — Type dropdown —
    ({ row: rowType, select: fldType } = createDropdownField(
      "Type:", "marker-fld-type",
      [
        { value: "Door",              label: "Door" },
        { value: "Extraction Portal", label: "Extraction Portal" },
        { value: "Item",              label: "Item" },
        { value: "Chest",             label: "Chest" },
        { value: "Teleport",          label: "Teleport" },
        { value: "Spawn Point",       label: "Spawn Point" }
      ],
      { showColor: false }
    ));
    fldType.innerHTML = `<option value="" disabled selected>Select type…</option>` + fldType.innerHTML;

    // — Predefined Item dropdown —
    ({ row: rowPredefItem, select: fldPredefItem } = createDropdownField(
      "Item:", "marker-fld-predef-item", [], { showColor: false }
    ));

    // — Chest Type dropdown —
    ({ row: rowChestType, select: fldChestType } = createDropdownField(
      "Chest Type:", "marker-fld-predef-chest", [], { showColor: false }
    ));

    // instantiate controller and mount its form
    ctrl = createMarkerFormController({
      onCancel:      () => closeModal(modal),
      onSubmit:      () => {},
      onFieldChange: () => {}
    }, db);

    // embed our dropdown rows into the controller's form
    ctrl.form.prepend(
      rowType,
      rowPredefItem,
      rowChestType
    );

    // assemble modal content
    content.append(
      ctrl.form,
      createFormButtonRow()
    );

    // show/hide on type change
    fldType.addEventListener("change", () => {
      rowPredefItem.style.display = fldType.value === "Item"  ? "flex" : "none";
      rowChestType.style.display  = fldType.value === "Chest" ? "flex" : "none";
    });

    // when picking a predefined item, populate fields via controller
    fldPredefItem.addEventListener("change", () => {
      const def = itemDefs[fldPredefItem.value] || {};
      ctrl.populate(def);
    });

    // initial reset
    ctrl.reset();
    ctrl.initPickrs();
  }

  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // set type & selectors
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));
    if (data.type === "Item") fldPredefItem.value = data.predefinedItemId || "";
    if (data.type === "Chest") fldChestType.value = data.chestTypeId || "";

    // let controller fill in the rest
    await ctrl.populate(data);

    // hook save
    ctrl.form.onsubmit = e => {
      e.preventDefault();
      onSave(markerObj, { ...data, ...ctrl.getCustom() }, evt);
      closeModal(modal);
    };

    openModalAt(modal, evt);
  }

  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    ctrl.reset();
    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));

    ctrl.form.onsubmit = e => {
      e.preventDefault();
      const payload = { type, coords, ...ctrl.getCustom() };
      onCreate(payload);
      closeModal(modal);
    };

    openModalAt(modal, evt);
  }

  return { openEdit, openCreate };
}
