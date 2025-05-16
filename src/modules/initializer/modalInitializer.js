// @file: src/modules/initializer/modalInitializer.js
// @version: 1.1 - added NPC definitions modal

import { db }                             from "../../appInit.js";
import { initMarkerModal }                from "../ui/modals/markerModal.js";
import { initItemDefinitionsModal }       from "../ui/modals/itemDefinitionsModal.js";
import { initNPCDefinitionsModal }        from "../ui/modals/npcDefinitionsModal.js";

export function initModals() {
  // Marker creation/editing modal
  const markerForm = initMarkerModal(db);

  // Item definitions modal
  initItemDefinitionsModal(db);

  // NPC definitions modal
  initNPCDefinitionsModal(db);

  return { markerForm };
}
