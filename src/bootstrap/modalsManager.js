// @file: src/bootstrap/modalsManager.js
// @version: 1.1 — return both markerForm and copyMgr

import { upsertMarker } from "../modules/services/firebaseService.js";
import { initMarkerModal } from "../modules/ui/modals/markerModal.js";
import { initItemDefinitionsModal } from "../modules/ui/modals/itemDefinitionsModal.js";
import { initCopyPasteManager } from "../modules/map/copyPasteManager.js";

function init(db, map) {
  const markerForm = initMarkerModal(db);
  initItemDefinitionsModal(db);
  const copyMgr = initCopyPasteManager(map, upsertMarker.bind(null, db));
  return { markerForm, copyMgr };
}

export default { init };
