// @file: src/appInit.js
// @version: 2 — switch to ES-module imports for Leaflet & MarkerCluster

import { initializeApp } from "firebase/app";
import { getFirestore }  from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

// ES-module imports for map libraries
import L from "leaflet";
import "markercluster";

import { initializeMap } from "./modules/map/map.js";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

// Initialize Leaflet map (using L from ES module)
export const { map } = initializeMap();

// Set up layers
export const clusterItemLayer = L.markerClusterGroup();
export const flatItemLayer    = L.layerGroup();

export const layers = {
  Door:                L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  Item:                flatItemLayer,
  Teleport:            L.layerGroup(),
  "Spawn Point":       L.layerGroup(),
  Chest:               L.layerGroup()
};

// Add non-item layers to the map
Object.entries(layers).forEach(([type, layer]) => {
  if (type !== "Item") layer.addTo(map);
});

// Show clustered items by default
flatItemLayer.addTo(map);
