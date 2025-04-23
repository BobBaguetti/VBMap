// @version: 1
// @file: /scripts/modules/ui/forms/controllers/questFormController.js

import { createQuestForm } from "../builders/questFormBuilder.js";

export function createQuestFormController({ onSubmit, onCancel, onDelete }) {
  const form = createQuestForm();
  return {
    form,
    reset: () => form.reset(),
    populate: (def) => { /* Populate form fields with quest data */ },
    getCustom: () => { return {}; }, // Return quest object
    initPickrs: () => {}
  };
}