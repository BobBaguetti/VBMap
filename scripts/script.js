// @fullfile: Send the entire file, no omissions or abridgment — version is 3. Increase by 1 every time you update anything.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 3
// @file:    /scripts/script.js

import {
  initializeFirebase,
  loadMarkers,
  addMarker as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/firebaseService.js";
import { initializeMap } from "./modules/map/map.js";
import { initializeMarkerManager } from "./modules/map/markerManager.js";
import { initCopyPasteManager } from "./modules/copyPasteManager.js";
import { showContextMenu } from "./modules/uiManager.js";
import {
  openEmptyMarkerForm,
  openMarkerFormWithData
} from "./modules/ui/markerForm.js";
import { initItemDefinitionsModal } from "./modules/ui/itemDefinitionsModal.js";
import { setupSidebar } from "./modules/sidebarManager.js";

(async () => {
  // Firebase Initialization
  const db = initializeFirebase({
    apiKey: "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain: "vbmap-cc834.firebaseapp.com",
    projectId: "vbmap-cc834",
    storageBucket: "vbmap-cc834.firebasestorage.app",
    messagingSenderId: "244112699360",
    appId: "1:244112699360:web:95f50adb6e10b438238585",
    measurementId: "G-7FDNWLRM95"
  });

  // Map Initialization
  const map = initializeMap();

  // Sidebar Setup
  const sidebar = setupSidebar(map);

  // Item Definitions Modal
  initItemDefinitionsModal(db, () => {
    sidebar.refreshItemFilters();
  });

  // Marker Manager
  const markerManager = initializeMarkerManager(map, []);

  // Load and render existing markers
  const markers = await loadMarkers(db);
  markers.forEach(data => markerManager.addMarker(data));

  // Copy/Paste Manager
  initCopyPasteManager(map, newData => {
    firebaseAddMarker(newData);
    markerManager.addMarker(newData);
  });

  // Map Context‑Menu for Creating New Markers
  map.on("contextmenu", evt => {
    const { pageX: x, pageY: y } = evt.originalEvent;
    showContextMenu(x, y, [
      { label: "Create New Marker", action: () => openEmptyMarkerForm() }
    ]);
  });
})();

// @version: 3
