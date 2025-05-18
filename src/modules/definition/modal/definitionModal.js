// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.18 — now delegates to DefinitionController

import { DefinitionController } from "../DefinitionController.js";
import { definitionTypes } from "../types.js";

/**
 * Initializes the Definition modal functionality.
 * Returns an object with two methods for opening the modal in create or edit mode.
 *
 * @param {import('../../bootstrap').db} db — Firestore database instance
 */
export function initDefinitionModal(db) {
  // Instantiate the controller once
  const controller = new DefinitionController(db, definitionTypes, () => {});

  return {
    /**
     * Open the modal to create a new definition of the given type.
     * @param {Event} [evt] — original click/event (unused here)
     * @param {string} [type] — one of the keys in definitionTypes
     */
    openCreate: (evt, type) => controller.openCreate(type),

    /**
     * Open the modal to edit an existing definition.
     * @param {object} def — the definition object to edit (must include .id)
     */
    openEdit: def => controller.openEdit(def)
  };
}
