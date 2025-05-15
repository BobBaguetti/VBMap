// @file: src/modules/ui/modals/npcDefinitionsModal.js
// @version: 1.0 — modal for creating & editing NPC definitions

import { definitionModalShell } from "../components/definitionModalShell.js";
import {
  loadNpcs,
  saveNpc,
  updateNpc,
  deleteNpc
} from "../../services/definitions/npcService.js";
import { createNpcForm } from "../forms/builders/npcFormBuilder.js";

/**
 * Initializes the NPC Definitions modal (admin only).
 * Export and call this in your bootstrap.
 *
 * @param {import('firebase/firestore').Firestore} db
 */
export function initNpcDefinitionsModal(db) {
  definitionModalShell({
    db,
    loadFn: loadNpcs,
    saveFn: saveNpc,
    updateFn: updateNpc,
    deleteFn: deleteNpc,
    formFactory: createNpcForm,
    modalId: "npc-definitions-modal",
    title: "NPC Definitions"
  });
}
