// @file: src/appInit.js
// @version: 1 — use global Leaflet (L) and MarkerCluster loaded via <script> tags
// Initializes Firebase & Leaflet map, and exports shared instances

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

import { initializeMap } from "./modules/map/map.js";

// initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

// initialize Leaflet map (global L is available from index.html <script> tags)
export const { map } = initializeMap();

// set up layers using global L
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

// add non-item layers to the map
Object.entries(layers).forEach(([type, layer]) => {
  if (type !== "Item") layer.addTo(map);
});

// show clustered items
flatItemLayer.addTo(map);
 