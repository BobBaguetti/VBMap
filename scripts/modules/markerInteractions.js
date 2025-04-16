// scripts/modules/markerInteractions.js
import { createMarker, createPopupContent } from "./markerManager.js";
import { loadMarkers, addMarker as firebaseAddMarker, updateMarker as firebaseUpdateMarker, deleteMarker as firebaseDeleteMarker } from "./firebaseService.js";
import { formatRarity } from "./utils.js";

// We'll maintain a local array of markers.
let allMarkers = [];

/**
 * Initializes marker interaction functionality.
 * Expects:
 *   map: The Leaflet map instance.
 *   layers: An object mapping marker types to their corresponding layers.
 *   contextMenuCallback: A function to show context menus.
 *   extraCallbacks: An optional object with additional functions to call on marker events.
 */
export function initMarkerInteractions(map, layers, contextMenuCallback, extraCallbacks = {}) {
  
  function handleEdit(markerObj, markerData, evt, populateEditForm, openEditModal) {
    // Populate the marker edit modal with the markerData.
    populateEditForm(markerData);
    // Position and show the modal.
    openEditModal(evt);
  }

  function handleCopy(markerObj, markerData, evt, setCopiedMarkerData, enablePasteMode) {
    // Deep copy of marker data (excluding its id)
    const copy = JSON.parse(JSON.stringify(markerData));
    delete copy.id;
    setCopiedMarkerData(copy);
    enablePasteMode();
  }

  function handleDragEnd(markerObj, markerData) {
    // Update coordinates after dragging
    markerData.coords = [markerObj.getLatLng().lat, markerObj.getLatLng().lng];
    firebaseUpdateMarker(markerData);
  }

  function handleDelete(markerObj, markerData) {
    layers[markerData.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id === markerData.id);
    if (idx !== -1) {
      allMarkers.splice(idx, 1);
    }
    firebaseDeleteMarker(markerData.id);
  }

  async function loadAndDisplayMarkers() {
    try {
      const markersData = await loadMarkers();
      markersData.forEach(markerData => {
        if (!markerData.type || !layers[markerData.type]) {
          console.error(`Invalid marker type: ${markerData.type}`);
          return;
        }
        if (!markerData.coords) markerData.coords = [1500, 1500];
        // Create a marker using your existing createMarker function.
        const markerObj = createMarker(markerData, map, layers, contextMenuCallback, {
          onEdit: (mObj, mData, evt) => {
            // extraCallbacks should supply populateEditForm and openEditModal functions.
            if (extraCallbacks.populateEditForm && extraCallbacks.openEditModal) {
              handleEdit(mObj, mData, evt, extraCallbacks.populateEditForm, extraCallbacks.openEditModal);
            }
          },
          onCopy: (mObj, mData, evt) => {
            if (extraCallbacks.setCopiedMarkerData && extraCallbacks.enablePasteMode) {
              handleCopy(mObj, mData, evt, extraCallbacks.setCopiedMarkerData, extraCallbacks.enablePasteMode);
            }
          },
          onDragEnd: (mObj, mData) => handleDragEnd(mObj, mData),
          onDelete: (mObj, mData) => handleDelete(mObj, mData)
        });
        allMarkers.push({ markerObj, data: markerData });
      });
    } catch (err) {
      console.error("Error loading markers:", err);
    }
  }

  return { loadAndDisplayMarkers, allMarkers, handleEdit, handleCopy, handleDragEnd, handleDelete };
}
