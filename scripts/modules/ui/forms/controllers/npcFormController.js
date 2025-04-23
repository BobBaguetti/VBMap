// @version: 1
// @file: /scripts/modules/ui/forms/controllers/npcFormController.js

import { createNpcForm } from "../builders/npcFormBuilder.js";

export function createNpcFormController({ onSubmit, onCancel, onDelete }) {
  const form = createNpcForm();
  return {
    form,
    reset: () => form.reset(),
    populate: (def) => { /* Populate form fields with NPC data */ },
    getCustom: () => { return {}; }, // Return NPC object
    initPickrs: () => {}
  };
}