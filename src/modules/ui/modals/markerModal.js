// @file: src/modules/ui/modals/markerModal.js
// @version: 2.1 — recreate as floating, draggable panel near cursor

import { createMarkerFormController } from "../forms/controllers/markerFormController.js";
import { createModal, makeDraggable } from "../components/uiKit/modalKit.js";

export function initMarkerModal(db) {
  let panelEl, formController, onSaveCb;

  return {
    openCreate(coords, defaultType, evt, saveCallback) {
      onSaveCb = saveCallback;
      this._open(evt.pageX, evt.pageY, "Create Marker", coords, defaultType);
    },
    openEdit(markerObj, data, evt, saveCallback) {
      onSaveCb = saveCallback;
      this._open(evt.pageX, evt.pageY, "Edit Marker", data.coords, data.type, data);
    },

    _open(x, y, title, coords, type, existingData) {
      // If panel doesn't exist, build it
      if (!panelEl) {
        // createModal returns { panel, header, body, close }
        const { panel, header, body, closeBtn } = createModal({
          size:     "small",    // small/internal CSS
          backdrop: false,      // no dark overlay
          draggable: true       // allow dragging
        });
        panel.classList.add("marker-modal-panel");
        panelEl = panel;

        // build our form inside it
        formController = createMarkerFormController({
          onCancel: () => this._close(),
          onSubmit: payload => {
            onSaveCb(payload);
            this._close();
          }
        }, db);
        body.appendChild(formController.form);

        // wire the close button
        closeBtn.onclick = () => this._close();

        // make the panel draggable by its header
        makeDraggable(panel, header);
      }

      // position it at cursor (or adjust if off-screen)
      panelEl.style.top  = `${y}px`;
      panelEl.style.left = `${x}px`;

      // reset & open with the correct mode
      formController.reset?.();
      formController.open(coords, type, evt);
      if (existingData) {
        formController.populate?.(existingData);
      }
      // update the title text
      panelEl.querySelector(".modal__title").textContent = title;

      // show it
      panelEl.classList.add("visible");
    },

    _close() {
      panelEl?.classList.remove("visible");
    }
  };
}
