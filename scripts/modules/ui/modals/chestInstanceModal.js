// @file: /scripts/modules/ui/modals/chestInstanceModal.js
// @version: 1.1 – streamlined build and save integration

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createChestInstanceFormController } from "../forms/controllers/chestInstanceFormController.js";
import { saveChest }                         from "../../services/chestsService.js";

/**
 * Admin modal to place a new chest on the map.
 * Use .open(coords) when right‐clicking the map.
 *
 * @param {import('firebase/firestore').Firestore} db
 */
export function initChestInstanceModal(db) {
  let modal, content, header, formApi;
  let coords;

  // Build the modal shell once
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
    // Only admins should see this
    modal.classList.add("admin-only");
  }

  return {
    /**
     * Open the modal at the given coordinates.
     * @param {[number,number]} latlng
     */
    open: async (latlng) => {
      coords = latlng;
      if (!modal) await build();

      // If a previous form exists, remove it
      if (formApi && content.contains(formApi.form)) {
        content.removeChild(formApi.form);
      }

      // Create a fresh controller wired to saveChest
      formApi = await createChestInstanceFormController({
        onCancel: () => closeModal(modal),
        onSubmit: async ({ chestTypeId }) => {
          // Persist to Firestore; real-time subscription will render it
          await saveChest(db, null, { chestTypeId, coords });
          closeModal(modal);
        }
      }, db, coords);

      // Allow scroll within small modal
      formApi.form.classList.add("ui-scroll-float");
      content.appendChild(formApi.form);

      openModal(modal);
    }
  };
}
