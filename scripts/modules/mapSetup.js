// mapSetup.js
// This module handles initializing the Leaflet map, setting up layer groups, and loading markers.

import L from 'leaflet';
import 'leaflet.markercluster';
import { db } from "./firebase.js";
import { logError } from "./errorLogger.js";
import { createPopupContent } from "./markerUtils.js"; // Import popup builder

// Global variables
let map;
export const allMarkers = []; // Array for markers' instances and data

// Define layer groups (keys should match marker data, e.g., "Item" not "items")
export const layers = {
  "Door": L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  "Item": L.markerClusterGroup(),
  "Teleport": L.layerGroup()
};

// Function: Initialize the map and add layers
export function initMap() {
  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false
  });
  L.control.zoom({ position: "topright" }).addTo(map);

  // Map bounds and overlay image
  const bounds = [[0, 0], [3000, 3000]];
  const imageUrl = "./media/images/tempmap.png"; // Ensure this path is correct relative to index.html
  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);

  // Add each layer group to the map
  Object.values(layers).forEach(layer => layer.addTo(map));

  return map;
}

// Function: Create a custom marker based on markerData.
export function createCustomMarker(markerData) {
  const marker = L.marker(markerData.coords, {
    icon: L.divIcon({
      html: `
        <div class="custom-marker">
          <div class="marker-border"></div>
          ${markerData.imageSmall ? `<img src="${markerData.imageSmall}" class="marker-icon"/>` : ""}
        </div>
      `,
      className: "custom-marker-container",
      iconSize: [32, 32],
    }),
    draggable: false
  });

  // Bind popup using the utility from markerUtils.js.
  marker.bindPopup(createPopupContent(markerData), {
    className: "custom-popup-wrapper",
    maxWidth: 350
  });

  // Store marker along with its data.
  allMarkers.push({ markerObj: marker, data: markerData });
  return marker;
}

// Function: Load markers from Firestore; fallback omitted since you use Firestore.
export function loadMarkers() {
  db.collection("markers")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        let data = doc.data();
        data.id = doc.id;
        if (!data.type || !layers[data.type]) {
          logError("Invalid marker type while loading marker:", new Error(`Type: ${data.type}`));
          return;
        }
        if (!data.coords) data.coords = [1500, 1500];
        const marker = createCustomMarker(data);
        layers[data.type].addLayer(marker);
      });
    })
    .catch(err => {
      logError("Error loading markers from Firestore:", err);
    });
}

// Export helper to retrieve the map instance.
export function getMap() {
  return map;
}
