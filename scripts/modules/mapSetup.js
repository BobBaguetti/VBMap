// mapSetup.js
import L from "leaflet";
import "leaflet.markercluster";
import { db } from "./firebase.js";
import { logError } from "./errorLogger.js";
import { createPopupContent } from "./markerUtils.js";
import { collection, getDocs } from "firebase/firestore";

// Global variable for the map instance.
let map;
export const allMarkers = [];

// Define layer groups for each marker type.
export const layers = {
  "Door": L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  "Item": L.markerClusterGroup(),
  "Teleport": L.layerGroup()
};

export function initMap() {
  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false
  });
  L.control.zoom({ position: "topright" }).addTo(map);

  const bounds = [[0, 0], [3000, 3000]];
  const imageUrl = "./media/images/tempmap.png";
  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);

  // Add each layer to the map.
  Object.values(layers).forEach(layer => layer.addTo(map));
  return map;
}

function createCustomMarker(markerData) {
  const marker = L.marker(markerData.coords, {
    icon: L.divIcon({
      html: `
        <div class="custom-marker">
          <div class="marker-border"></div>
          ${markerData.imageSmall ? `<img src="${markerData.imageSmall}" class="marker-icon"/>` : ""}
        </div>
      `,
      className: "custom-marker-container",
      iconSize: [32, 32]
    }),
    draggable: false
  });

  marker.bindPopup(createPopupContent(markerData), {
    className: "custom-popup-wrapper",
    maxWidth: 350
  });

  allMarkers.push({ markerObj: marker, data: markerData });
  return marker;
}

export function loadMarkers() {
  const markersCol = collection(db, "markers");
  getDocs(markersCol)
    .then(querySnapshot => {
      querySnapshot.forEach(docSnap => {
        let data = docSnap.data();
        data.id = docSnap.id;
        if (!data.type || !layers[data.type]) {
          logError("Invalid marker type while loading marker:", new Error(`Type: ${data.type}`));
          return;
        }
        if (!data.coords) data.coords = [1500, 1500];
        const markerObj = createCustomMarker(data);
        layers[data.type].addLayer(markerObj);
      });
    })
    .catch(error => {
      logError("Error loading markers from Firestore:", error);
    });
}

export function getMap() {
  return map;
}
