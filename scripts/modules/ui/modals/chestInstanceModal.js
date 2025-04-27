// @file: /scripts/modules/ui/modals/chestInstanceModal.js
// @version: 1.0

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createChestInstanceFormController } from "../forms/controllers/chestInstanceFormController.js";

/**
 * Admin modal to place a new chest on the map.
 * @param {import('firebase/firestore').Firestore} db
 * @param {[number,number]} coords The lat/lng where the user clicked
 */
export function initChestInstanceModal(db, coords) {
  let modal, content, header, formApi;

  async function build() {
    const created = createModal({
      id:       "chest-instance-modal",
      title:    "Add Chest",
      size:     "small",
      backdrop: true,
      onClose:  () => closeModal(modal)
    });
    modal   = created.modal;
    content = created.content;
    header  = created.header;
    modal.classList.add("admin-only");

    formApi = await createChestInstanceFormController({
      onCancel: () => closeModal(modal),
      onSubmit: async payload => {
        await payload.saveFn(payload); // we’ll override below
        closeModal(modal);
      }
    }, db, coords);

    formApi.form.classList.add("ui-scroll-float");
    content.appendChild(formApi.form);
  }

  return {
    open: async (_coords, saveFn) => {
      coords = _coords;
      if (!modal) await build();
      // inject the save function
      formApi.form.removeEventListener; // no-op
      formApi = await createChestInstanceFormController({
        onCancel: () => closeModal(modal),
        onSubmit: async payload => {
          payload.saveFn = saveFn;
          await saveFn(payload);
          closeModal(modal);
        }
      }, db, coords);
      openModal(modal);
    }
  };
}
