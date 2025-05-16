// @file: src/modules/initializer/modalInitializer.js
// @version: 1.1 - added NPC definitions modal

import { db } from "../appInit.js";
import { initMarkerModal } from "../modules/ui/modals/markerModal.js";
import { initItemDefinitionsModal } from "../modules/ui/modals/itemDefinitionsModal.js";
import { initNPCDefinitionsModal } from "../modules/ui/modals/npcDefinitionsModal.js";

export function initModals() {
  // Marker creation/editing modal
  const markerForm = initMarkerModal(db);

  // Item definitions modal
  initItemDefinitionsModal(db);

  // NPC definitions modal
  initNPCDefinitionsModal(db);

  return { markerForm };
}
