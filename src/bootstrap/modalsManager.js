// @file: src/bootstrap/modalsManager.js
// @version: 1.0 — initialize marker & item-definition modals and copy/paste manager

import { upsertMarker } from "../modules/services/firebaseService.js";
import { initMarkerModal } from "../modules/ui/modals/markerModal.js";
import { initItemDefinitionsModal } from "../modules/ui/modals/itemDefinitionsModal.js";
import { initCopyPasteManager } from "../modules/map/copyPasteManager.js";

/**
 * Set up admin modals and copy/paste.
 * @param {Firestore} db
 * @param {L.Map} map
 * @returns {{ markerForm: Object }} the marker form controller
 */
function init(db, map) {
  const markerForm = initMarkerModal(db);
  initItemDefinitionsModal(db);
  initCopyPasteManager(map, upsertMarker.bind(null, db));
  return { markerForm };
}

export default {
  init
};
