// @file: src/bootstrap/modalsManager.js
// @version: 1.2 — switch to unified definition modal

import { upsertMarker }                        from "../modules/services/firebaseService.js";
import { initMarkerModal }                     from "../modules/marker/modal/markerModal.js";
import { initDefinitionModal }                 from "../modules/definition/modal/definitionModal.js";
import { initCopyPasteManager }                from "../modules/map/copyPasteManager.js";

function init(db, map) {
  const markerForm = initMarkerModal(db);
  const definitionModal = initDefinitionModal(db);
  const copyMgr    = initCopyPasteManager(map, upsertMarker.bind(null, db));

  return { markerForm, definitionModal, copyMgr };
}

export default { init };
