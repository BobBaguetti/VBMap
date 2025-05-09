// @file: src/modules/ui/modals/markerModal.js
// @version: 2.0 — use new builder + controller pattern

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createMarkerFormController } from "../forms/controllers/markerFormController.js";

export function initMarkerModal(db) {
  let modal, header, content, openShell;
  let formController;

  return {
    openCreate(coords, defaultType, evt, saveCallback) {
      if (!modal) this._initModal(saveCallback);
      // Reset and open in “create” mode
      formController.reset?.();
      formController.open(coords, defaultType, evt);
      header.querySelector(".modal__title").textContent = "Create Marker";
      openShell();
    },

    openEdit(markerObj, data, evt, saveCallback) {
      if (!modal) this._initModal(saveCallback);
      // Populate form from `data`, then open in “edit” mode
      formController.reset?.();
      formController.open(data.coords, data.type, evt);
      formController.populate?.(data);
      header.querySelector(".modal__title").textContent = "Edit Marker";
      openShell();
    },

    _initModal(saveCallback) {
      // Build modal shell
      ({ modal, header, content, open: openShell } = createDefinitionModalShell({
        id:         "marker-modal",
        title:      "Edit Marker",
        size:       "small",
        searchable: false,
        onClose:    () => formController.hidePreview?.()
      }));
      modal.classList.add("admin-only");

      // Instantiate the new form controller
      formController = createMarkerFormController({
        onCancel: () => openShell(false),
        onSubmit: payload => {
          saveCallback(payload);
          openShell(false);
        }
      }, db);

      // Inject the form into the modal
      content.appendChild(formController.form);

      // Wire up any preview region if needed
      // e.g. formController.showPreview = preview.show;
      // (you can add preview wiring here, mirroring definition modals)

      // Finally, return the formController
      return formController;
    }
  };
}
