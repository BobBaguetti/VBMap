// @file: src/modules/ui/modals/markerModal.js
// @version: 21.0 — wire in the new markerFormController (unslimmed)

import {
  createModal,
  closeModal,
  openModalAt
} from "../uiKit.js";
import {
  createDropdownField,
  createFormButtonRow
} from "../components/uiKit/fieldKit.js";
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, content;

  function ensureBuilt() {
    if (modal) return;
    ({ modal, content } = createModal({
      id:          "marker-modal",
      title:       "Place Marker",
      size:        "small",
      draggable:   true,
      withDivider: true,
      onClose:     () => closeModal(modal)
    }));
  }

  // ─── Open for creating a new marker ────────────────────────────
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    content.innerHTML = "";

    // — Type —
    const { row: rowType, select: fldType } =
      createDropdownField("Type:", "fld-type", [
        { value: "",     label: "Select Marker Type" },
        { value: "Item", label: "Item" },
        { value: "Chest",label: "Chest" }
      ], { showColor: false });
    content.appendChild(rowType);

    // — Predefined Item —
    const { row: rowPredefItem, select: fldPredefItem } =
      createDropdownField("Item Definition:", "fld-predef-item", [], { showColor: false });
    content.appendChild(rowPredefItem);

    // — Chest Definition —
    const { row: rowChestType, select: fldChestType } =
      createDropdownField("Chest Definition:", "fld-predef-chest", [], { showColor: false });
    content.appendChild(rowChestType);

    // — The form controller (builder + wiring) —
    const formApi = createMarkerFormController(
      {
        onCancel: () => closeModal(modal),
        onSubmit: payload => {
          onCreate({ coords, ...payload });
          closeModal(modal);
        },
        onFieldChange: () => {}
      },
      db
    );
    content.appendChild(formApi.form);

    // Initialize form state
    formApi.reset();
    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));
    formApi.initPickrs();

    // Save / Cancel buttons
    formApi.form.appendChild(
      createFormButtonRow(() => closeModal(modal))
    );

    openModalAt(modal, evt);
  }

  // ─── Open for editing an existing marker ───────────────────────
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    content.innerHTML = "";

    // — Type —
    const { row: rowType, select: fldType } =
      createDropdownField("Type:", "fld-type", [
        { value: "",     label: "Select Marker Type" },
        { value: "Item", label: "Item" },
        { value: "Chest",label: "Chest" }
      ], { showColor: false });
    content.appendChild(rowType);

    // — Predefined Item —
    const { row: rowPredefItem, select: fldPredefItem } =
      createDropdownField("Item Definition:", "fld-predef-item", [], { showColor: false });
    content.appendChild(rowPredefItem);

    // — Chest Definition —
    const { row: rowChestType, select: fldChestType } =
      createDropdownField("Chest Definition:", "fld-predef-chest", [], { showColor: false });
    content.appendChild(rowChestType);

    // — The form controller (builder + wiring) —
    const formApi = createMarkerFormController(
      {
        onCancel: () => closeModal(modal),
        onSubmit: payload => {
          onSave(markerObj, payload, evt);
          closeModal(modal);
        },
        onFieldChange: () => {}
      },
      db
    );
    content.appendChild(formApi.form);

    // Populate with existing data
    await formApi.populate(data);
    formApi.initPickrs();

    // Save / Cancel buttons
    formApi.form.appendChild(
      createFormButtonRow(() => closeModal(modal))
    );

    openModalAt(modal, evt);
  }

  return { openCreate, openEdit };
}
