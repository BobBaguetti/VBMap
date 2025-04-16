// mapSetup.js
// This module handles initializing the Leaflet map, setting up layer groups, and loading markers.

import L from "leaflet";
import "leaflet.markercluster";
import { db } from "./firebase.js";
import { logError } from "./errorLogger.js";

// Global variables within this module
let map;
export const allMarkers = []; // Array to hold markers data and instances

// Define layer groups for each marker type
export const layers = {
  "Door": L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  "Item": L.markerClusterGroup(),
  "Teleport": L.layerGroup(),
};

// Function: Initialize the map and add layers
export function initMap() {
  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false,
  });
  L.control.zoom({ position: "topright" }).addTo(map);

  // Define map bounds and add your map overlay image:
  const bounds = [[0, 0], [3000, 3000]];
  const imageUrl = "./media/images/tempmap.png"; // Update if necessary
  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);

  // Add each layer group to the map:
  Object.values(layers).forEach((layer) => layer.addTo(map));

  return map;
}

// Function: Create a custom marker and add it to the map.
// (For further modularity, you could move icon creation and popup construction to markerUtils.js later.)
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
    draggable: false,
  });

  marker.bindPopup(createPopupContent(markerData), {
    className: "custom-popup-wrapper",
    maxWidth: 350,
  });

  // Store marker along with its data
  allMarkers.push({ markerObj: marker, data: markerData });
  return marker;
}

// Helper function: Create popup content for a marker.
function createPopupContent(m) {
  let itemTypeHTML = "";
  let rarityHTML = "";
  let descHTML = "";
  let extraHTML = "";

  if (m.type === "Item") {
    if (m.itemType) {
      itemTypeHTML = `<div style="font-size:16px; color:${m.itemTypeColor || "#E5E6E8"}; margin:2px 0;">${m.itemType}</div>`;
    }
    if (m.rarity) {
      rarityHTML = `<div style="font-size:16px; color:${m.rarityColor || "#E5E6E8"}; margin:2px 0;">${m.rarity}</div>`;
    }
    if (m.description) {
      descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
    }
    if (m.extraLines && m.extraLines.length) {
      m.extraLines.forEach((line) => {
        extraHTML += `<p style="margin-top:5px; margin-bottom:0; color:${line.color || "#E5E6E8"};">${line.text}</p>`;
      });
    }
  } else {
    if (m.description) {
      descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
    }
  }
  
  const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor || "#E5E6E8"};">${m.name}</h3>`;
  const scaledImg = m.imageBig 
    ? `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;" />`
    : "";
  let videoBtn = "";
  if (m.videoURL) {
    videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
  }
  return `
    <div class="custom-popup">
      <div class="popup-header" style="display:flex; gap:5px;">
        ${scaledImg}
        <div style="margin-left:5px;">
          ${nameHTML}
          ${itemTypeHTML}
          ${rarityHTML}
        </div>
      </div>
      <div class="popup-body">
        ${descHTML}
        ${extraHTML}
        ${videoBtn}
      </div>
    </div>
  `;
}

// Function: Load markers from Firestore; fallback to a local JSON file on error.
export function loadMarkers() {
  db.collection("markers")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
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
    .catch((err) => {
      logError("Error loading markers from Firestore:", err);
      // fallback to JSON file:
      fetch("./data/markerData.json")
        .then((resp) => {
          if (!resp.ok) throw new Error("Network response was not ok");
          return resp.json();
        })
        .then((jsonData) => {
          jsonData.forEach((m) => {
            if (!m.type || !layers[m.type]) {
              logError("Invalid marker type in fallback JSON:", new Error(`Type: ${m.type}`));
              return;
            }
            const marker = createCustomMarker(m);
            layers[m.type].addLayer(marker);
          });
        })
        .catch((err2) => {
          logError("Error loading markers from local JSON:", err2);
        });
    });
}

// Export a helper to get the map instance if needed
export function getMap() {
  return map;
}
