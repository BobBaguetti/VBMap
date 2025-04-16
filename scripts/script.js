// scripts/script.js
import { initializeMap }    from "./modules/map.js";
import { attachContextMenuHider, attachRightClickCancel, showContextMenu } from "./modules/uiManager.js";
import { initializeFirebase, loadMarkers }     from "./modules/firebaseService.js";
import { createMarker }      from "./modules/markerManager.js";
import { formatRarity }      from "./modules/utils.js";
import { initMarkerEditManager } from "./modules/markerEditManager.js";
import { initItemDefinitionsManager } from "./modules/itemDefinitionsManager.js"; // if you still want item defs

document.addEventListener("DOMContentLoaded", async () => {
  const db = initializeFirebase({ /* your config */ });
  const { map } = initializeMap();

  // Layers
  const layers = {
    Door:     L.layerGroup().addTo(map),
    "Extraction Portal": L.layerGroup().addTo(map),
    Item:     L.markerClusterGroup().addTo(map),
    Teleport: L.layerGroup().addTo(map)
  };

  attachContextMenuHider();
  attachRightClickCancel(() => markerEdit.disablePaste());

  // Load existing markers
  const allMarkers = [];
  const snapshot = await loadMarkers(db);
  snapshot.forEach(doc => {
    const data = doc.data();
    data.id = doc.id;
    const mObj = createMarker(data, map, layers, showContextMenu, {
      onEdit: (marker, md, evt) => {
        markerEdit.populate({ marker, data: md });
        markerEdit.open(evt.originalEvent);
      },
      onCopy:    (marker,md) => { markerEdit.setCopied(md); markerEdit.enablePaste(); },
      onDragEnd: (marker,md) => { firebaseUpdateMarker(md); },
      onDelete:  (marker,md) => { /* your delete logic*/ }
    });
    allMarkers.push({ marker: mObj, data });
  });

  // Initialize marker edit manager
  const markerEdit = initMarkerEditManager({
    map,
    layers,
    onNewMarker: md => {
      const mObj = createMarker(md, map, layers, showContextMenu, { /* same callbacks */ });
      allMarkers.push({ marker: mObj, data: md });
    },
    onUpdateMarker: md => { /* update in allMarkers */ },
    getCopiedData: () => markerEdit._copiedData,
    setCopiedData: d => markerEdit._copiedData = d
  });

  // Initialize Item Definitions if you still need it
  initItemDefinitionsManager(db);
});
