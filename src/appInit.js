// @file: src/appInit.js
// @version: 1.2 — force Chest into cluster layer

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

// export a dedicated NPC layer alias that uses the same flat layer
export const npcLayer = flatItemLayer;

// define all your map layers by type
export const layers = {
  Door:                L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  Item:                flatItemLayer,        // Items remain in the flat layer by default
  Teleport:            L.layerGroup(),
  "Spawn Point":       L.layerGroup(),
  Chest:               clusterItemLayer,     // ← Chest now uses the cluster group
  NPC:                 npcLayer
};

// add non-item layers to the map
Object.entries(layers).forEach(([type, layer]) => {
  if (type !== "Item") {
    layer.addTo(map);
  }
});

// show flat items (and NPCs, since they share flatItemLayer)
flatItemLayer.addTo(map);

// ensure chest clusters render on load
clusterItemLayer.addTo(map);
