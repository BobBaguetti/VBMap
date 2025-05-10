// @file: src/modules/ui/modals/markerModal.js
// @version: 1.0 — slim modal shell delegating to markerFormController

import {
  createModal,
  openModalAt,
  closeModal
} from "../components/uiKit/modalKit.js";                // re-export of modalCore, modalSmall :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { createMarkerFormController } from "../forms/controllers/markerFormController.js"; // controller built around builder

/**
 * Initializes the marker modal (small, draggable).
 *
 * Returns an object with openCreate and openEdit methods,
 * matching the old API but delegating rendering & logic to the form controller.
 *
 * @param {firebase.firestore.Firestore} db
 */
export function initMarkerModal(db) {
  let built = false;
  let modal, content;
  // instantiate controller once; its `form` element lives in the modal
  const formCtrl = createMarkerFormController({
    onCancel:    () => closeModal(modal),
    onSubmit:    payload => {},            // overwritten per-open
    onFieldChange: () => {}                // optional live‐preview hook
  }, db);

  function ensureBuilt() {
    if (built) return;
    built = true;
    // create the shell
    ({ modal, content } = createModal({
      id:         "edit-marker-modal",
      title:      "Place Marker",
      size:       "small",
      backdrop:   false,
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    }));
    modal.classList.add("admin-only");
    // mount the form into the modal content
    content.appendChild(formCtrl.form);
  }

  return {
    /**
     * Open in “create” mode.
     * @param {[number, number]} coords
     * @param {string} defaultType
     * @param {MouseEvent} evt
     * @param {(payload: object) => void} onCreate
     */
    openCreate(coords, defaultType, evt, onCreate) {
      ensureBuilt();
      // reset to blank, then set coords & type
      formCtrl.reset();
      formCtrl.form.querySelector("#fld-type").value = defaultType || "";
      formCtrl.form.querySelector("#fld-type").dispatchEvent(new Event("change"));
      formCtrl.initPickrs();

      // wire submit to call onCreate
      formCtrl.form.onsubmit = e => {
        e.preventDefault();
        const custom = formCtrl.getCurrentPayload();
        onCreate({ type: custom.type, coords, ...custom });
        closeModal(modal);
      };

      openModalAt(modal, evt);
    },

    /**
     * Open in “edit” mode.
     * @param {L.Marker} markerObj
     * @param {object} data — existing marker data (including coords, type, etc.)
     * @param {MouseEvent} evt
     * @param {(markerObj: L.Marker, payload: object, evt: MouseEvent) => void} onEdit
     */
    openEdit(markerObj, data, evt, onEdit) {
      ensureBuilt();
      // populate form with existing definition
      formCtrl.populate(data);
      formCtrl.initPickrs();

      // wire submit to call onEdit
      formCtrl.form.onsubmit = e => {
        e.preventDefault();
        const custom = formCtrl.getCurrentPayload();
        onEdit(markerObj, { type: custom.type, coords: data.coords, ...custom }, evt);
        closeModal(modal);
      };

      openModalAt(modal, evt);
    }
  };
}
