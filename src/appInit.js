// @file: src/appInit.js
// Initializes Firebase & Leaflet map, and exports shared instances

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

import { initializeMap } from "../scripts/modules/map/map.js";
import L from "leaflet";
import "leaflet.markercluster";

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

// Initialize Leaflet map
export const { map } = initializeMap();

// Layers
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

// Add all non-Item layers by default
Object.entries(layers).forEach(([t, layer]) => {
  if (t !== "Item") layer.addTo(map);
});

// Add clustered items
flatItemLayer.addTo(map);
