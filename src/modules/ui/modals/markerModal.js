// @file: src/modules/ui/modals/markerModal.js
// @version: 1.0 — slim modal shell delegating to markerFormController

import {
  createModal,
  closeModal,
  openModalAt,
  createDropdownField,
  createFormButtonRow
} from "../uiKit.js"; // re-exports modalKit + fieldKit :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, content;
  let formApi;

  function ensureBuilt(onSave, onCancel) {
    if (modal) return;

    // 1) Create shell
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

    // 2) Instantiate the form controller
    formApi = createMarkerFormController(
      { onSubmit: onSave, onCancel, onFieldChange: () => {} },
      db
    );
    const form = formApi.form;

    // 3) Build “Type” selector row
    const { row: rowType, select: fldType } = createDropdownField(
      "Type:",
      "fld-type",
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
    // insert placeholder
    fldType.innerHTML =
      `<option value="" disabled selected>Select type…</option>` +
      fldType.innerHTML;

    // 4) Build “Predefined Item” selector row
    const { row: rowPredefItem, select: fldPredefItem } = createDropdownField(
      "Item:",
      "fld-predef-item",
      [],
      { showColor: false }
    );

    // 5) Build “Chest Type” selector row
    const { row: rowChestType, select: fldChestType } = createDropdownField(
      "Chest Type:",
      "fld-predef-chest",
      [],
      { showColor: false }
    );

    // 6) Build button row
    const rowButtons = createFormButtonRow(() => closeModal(modal));

    // 7) Inject rows into the form, before the first builder field
    const firstField = form.querySelector(".field-row");
    form.insertBefore(rowType,       firstField);
    form.insertBefore(rowPredefItem, rowType.nextSibling);
    form.insertBefore(rowChestType,  rowPredefItem.nextSibling);
    form.appendChild(rowButtons);

    // 8) Mount the form into the modal
    content.appendChild(form);
  }

  /**
   * Open the modal for creating a new marker.
   * @param {[number,number]} coords
   * @param {string} type
   * @param {MouseEvent} evt
   * @param {(payload: object) => void} onCreate
   */
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt(
      payload => onCreate({ ...payload, coords }),
      ()      => closeModal(modal)
    );
    formApi.reset();
    await formApi.populate({ type: type || "", coords });
    formApi.initPickrs();
    openModalAt(modal, evt);
  }

  /**
   * Open the modal for editing an existing marker.
   * @param {L.Marker} markerObj
   * @param {object} data
   * @param {MouseEvent} evt
   * @param {(markerObj: L.Marker, payload: object) => void} onSave
   */
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt(
      payload => onSave(markerObj, { ...payload, coords: data.coords }),
      ()      => closeModal(modal)
    );
    formApi.reset();
    await formApi.populate(data);
    formApi.initPickrs();
    openModalAt(modal, evt);
  }

  return { openCreate, openEdit };
}
