// @file: src/modules/ui/modals/markerModal.js
// @version: 21.1 — fix import path for modalKit

import {
  createModal,
  openModalAt,
  closeModal
} from "../components/uiKit/modalKit.js";  // corrected relative path
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, content, ctrl;

  // Build modal + form once
  function ensureBuilt() {
    if (modal) return;
    const { modal: m, content: c } = createModal({
      id:         "marker-modal",
      title:      "Marker",
      size:       "small",
      backdrop:   true,
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = m;
    content = c;

    // Instantiate our form controller
    ctrl = createMarkerFormController({
      onCancel:      () => closeModal(modal),
      onSubmit:      () => {},       // will be wired per-open
      onFieldChange: () => {}        // preview is handled elsewhere
    }, db);

    // Mount the form
    content.appendChild(ctrl.form);
  }

  /**
   * Open the modal to edit an existing marker.
   *
   * @param {L.Marker}        markerObj
   * @param {object}          data      — existing marker data
   * @param {MouseEvent}      evt       — opening event
   * @param {Function}        onSave    — callback(markerObj, payload, evt)
   */
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await ctrl.populate(data);
    ctrl.initPickrs();
    openModalAt(modal, evt);

    ctrl.form.onsubmit = e => {
      e.preventDefault();
      const payload = ctrl.getCustom();
      // retain updated coords from any drag
      const { lat, lng } = markerObj.getLatLng();
      payload.coords = [lat, lng];
      onSave(markerObj, payload, evt);
      closeModal(modal);
    };
  }

  /**
   * Open the modal to create a new marker.
   *
   * @param {[number,number]} coords
   * @param {string}          type      — initial marker type
   * @param {MouseEvent}      evt
   * @param {Function}        onCreate  — callback(payload)
   */
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    ctrl.reset();
    await ctrl.populate({ type, coords, extraLines: [] });
    ctrl.initPickrs();
    openModalAt(modal, evt);

    ctrl.form.onsubmit = e => {
      e.preventDefault();
      const payload = ctrl.getCustom();
      payload.coords = coords;
      onCreate(payload);
      closeModal(modal);
    };
  }

  return { openEdit, openCreate };
}
