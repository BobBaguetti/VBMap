// scripts/script.js
import { initializeMap } from "./modules/map.js";
import { createMarker, createPopupContent } from "./modules/markerManager.js";
import { initializeFirebase, loadMarkers,
         addMarker as firebaseAddMarker,
         updateMarker as firebaseUpdateMarker,
         deleteMarker as firebaseDeleteMarker } from "./modules/firebaseService.js";
import { loadItemDefinitions } from "./modules/itemDefinitionsService.js";
import { initMarkerForm } from "./modules/markerForm.js";
import { attachContextMenuHider, attachRightClickCancel } from "./modules/uiManager.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Init Firebase & Map
  const firebaseConfig = { /* your config */ };
  const db = initializeFirebase(firebaseConfig);
  const { map } = initializeMap();

  // Layers
  const layers = {
    "Door": L.layerGroup().addTo(map),
    "Extraction Portal": L.layerGroup().addTo(map),
    "Item": L.markerClusterGroup().addTo(map),
    "Teleport": L.layerGroup().addTo(map)
  };
  const allMarkers = [];

  // Copy‑Paste
  let copiedMarker = null, pasteMode = false;
  function cancelPaste() { pasteMode = false; copiedMarker = null; }
  attachContextMenuHider();
  attachRightClickCancel(cancelPaste);

  // Marker Form
  const { openEdit, openCreate, refreshPredefinedItems } = initMarkerForm(db);

  // Load & display
  const markers = await loadMarkers(db);
  markers.forEach(m => {
    const mk = createMarker(m, map, layers, showContextMenu, {
      onEdit: (mo, data, evt) => openEdit(mo, data, evt, updated => {
        mo.setPopupContent(createPopupContent(updated));
        firebaseUpdateMarker(db, updated);
      }),
      onCopy: (mo, data) => { copiedMarker = { ...data }; pasteMode = true; },
      onDelete: (mo, data) => {
        layers[data.type].removeLayer(mo);
        firebaseDeleteMarker(db, data.id);
      }
    });
    allMarkers.push({ mk, data: m });
  });

  // Context menu for creation
  map.on("contextmenu", evt => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
      text: "Create New Marker",
      action: () => openCreate([evt.latlng.lat, evt.latlng.lng], "Item", evt.originalEvent, newData => {
        const mk = createMarker(newData, map, layers, showContextMenu, {
          onEdit: /* same as above */,
          onCopy: /* ... */,
          onDelete: /* ... */
        });
        firebaseAddMarker(db, newData);
      })
    }]);
  });

  // Paste mode placement
  map.on("click", evt => {
    if (pasteMode && copiedMarker) {
      const clone = { ...copiedMarker, coords: [evt.latlng.lat, evt.latlng.lng] };
      createMarker(clone, map, layers, showContextMenu, {/* callbacks */});
      firebaseAddMarker(db, clone);
    }
  });

  // Search
  document.getElementById("search-bar").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    allMarkers.forEach(({ mk, data }) => {
      const show = data.name.toLowerCase().includes(q);
      layers[data.type][show ? 'addLayer' : 'removeLayer'](mk);
    });
  });

  // Sidebar accordion behavior
  document.querySelectorAll(".accordion-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const isOpen = panel.style.display === "block";
      panel.style.display = isOpen ? "none" : "block";
      btn.querySelector("i").classList.toggle("fa-chevron-down", !isOpen);
      btn.querySelector("i").classList.toggle("fa-chevron-right", isOpen);
    });
  });

  // Refresh definitions list whenever Manage Items is opened
  document.getElementById("manage-item-definitions").addEventListener("click", () => {
    refreshPredefinedItems();
  });
});
