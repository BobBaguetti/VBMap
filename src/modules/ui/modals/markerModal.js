// @file: src/modules/ui/modals/markerModal.js
// @version: 21.0 — migrate to markerFormController

import {
  createModal,
  closeModal,
  openModalAt
} from "../uiKit.js";
import { createDropdownField, createFormButtonRow } from "../../components/uiKit/fieldKit.js";
import { loadItemDefinitions }  from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions } from "../../services/chestDefinitionsService.js";
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, content, ctrl;
  let fldType, fldPredefItem, fldChestType;
  let rowType, rowPredefItem, rowChestType;
  let itemDefs = {}, chestDefs = {};

  // preload defs
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

    // create the modal
    const m = createModal({
      id:         "edit-marker-modal",
      title:      "Edit Marker",
      size:       "small",
      backdrop:   false,
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = m.modal;
    content = m.content;
    modal.classList.add("admin-only");

    // Type dropdown
    ({ row: rowType, select: fldType } = createDropdownField(
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
    ));
    // insert placeholder
    fldType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
    ` + fldType.innerHTML;

    // Predef-item dropdown
    ({ row: rowPredefItem, select: fldPredefItem } = createDropdownField(
      "Item:", "fld-predef-item", [], { showColor: false }
    ));

    // Chest-type dropdown
    ({ row: rowChestType, select: fldChestType } = createDropdownField(
      "Chest Type:", "fld-predef-chest", [], { showColor: false }
    ));

    // instantiate the controller
    ctrl = createMarkerFormController({
      onCancel: () => closeModal(modal),
      onSubmit: payload => {
        // pass payload back to whoever opened us
        // this will be bound per-open in openCreate/openEdit below
      },
      onFieldChange: () => {}
    }, db);

    // assemble form
    content.append(
      rowType,
      rowPredefItem,
      rowChestType,
      ctrl.form,            // entire form built by controller
      createFormButtonRow()
    );

    // show/hide sections on type change
    fldType.addEventListener("change", () => {
      rowPredefItem.style.display = fldType.value === "Item"  ? "flex" : "none";
      rowChestType.style.display  = fldType.value === "Chest" ? "flex" : "none";
      // let controller handle hiding item-vs-non-item fields itself
    });

    // when picking a predefined item, have controller pull in its fields
    fldPredefItem.addEventListener("change", () => {
      const def = itemDefs[fldPredefItem.value] || {};
      ctrl.populate(def);       // controller’s populate will set name, colors, etc.
    });

    // seed initial pickrs
    ctrl.reset();
    ctrl.initPickrs();
  }

  // edit existing marker
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // clear selectors
    fldPredefItem.value = "";
    fldChestType.value  = "";

    // set type and then populate controller
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));

    if (data.type === "Item" && data.predefinedItemId) {
      fldPredefItem.value = data.predefinedItemId;
      fldPredefItem.dispatchEvent(new Event("change"));
    }
    if (data.type === "Chest" && data.chestTypeId) {
      fldChestType.value = data.chestTypeId;
    }

    // controller.populate knows both item & non-item paths
    ctrl.populate(data);

    // wire our onSave into the controller’s submit hook
    ctrl.form.onsubmit = e => {
      e.preventDefault();
      onSave(markerObj, { ...data, ...ctrl.getCustom() }, evt);
      closeModal(modal);
    };

    openModalAt(modal, evt);
  }

  // create new marker
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // reset controller to blank
    ctrl.reset();

    // set type
    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));

    // wire create callback
    ctrl.form.onsubmit = e => {
      e.preventDefault();
      const out = { type, coords, ...ctrl.getCustom() };
      onCreate(out);
      closeModal(modal);
    };

    openModalAt(modal, evt);
  }

  return { openEdit, openCreate };
}
