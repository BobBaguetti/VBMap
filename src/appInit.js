// @file: appInit.js
// @version: 4 — corrected import paths for in-`src/` context (no double “src”)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

import { initializeMap } from "./modules/map/map.js";

// Definition services
import {
  loadItems,
  subscribeItems
} from "./modules/services/definitions/itemService.js";
import {
  loadChests,
  subscribeChests
} from "./modules/services/definitions/chestService.js";
import {
  loadQuests,
  subscribeQuests
} from "./modules/services/definitions/questService.js";
import {
  loadNpcs,
  subscribeNpcs
} from "./modules/services/definitions/npcService.js";
import {
  loadSpawnpoints,
  subscribeSpawnpoints
} from "./modules/services/definitions/spawnpointService.js";
import {
  loadTeleports,
  subscribeTeleports
} from "./modules/services/definitions/teleportService.js";
import {
  loadExtractions,
  subscribeExtractions
} from "./modules/services/definitions/extractionService.js";
import {
  loadDoors,
  subscribeDoors
} from "./modules/services/definitions/doorsService.js";
import {
  loadGates,
  subscribeGates
} from "./modules/services/definitions/gatesService.js";
import {
  loadMisc,
  subscribeMisc
} from "./modules/services/definitions/miscService.js";
import {
  loadSecrets,
  subscribeSecrets
} from "./modules/services/definitions/secretService.js";

// initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

// initialize Leaflet map (global L is available)
export const { map } = initializeMap();

// cluster & flat layers
export const clusterItemLayer = L.markerClusterGroup();
export const flatItemLayer    = L.layerGroup();

// layer groups for each type
export const layers = {
  item:       flatItemLayer,
  chest:      L.layerGroup(),
  quest:      L.layerGroup(),
  npc:        L.layerGroup(),
  spawnpoint: L.layerGroup(),
  teleport:   L.layerGroup(),
  extraction: L.layerGroup(),
  door:       L.layerGroup(),
  gate:       L.layerGroup(),
  misc:       L.layerGroup(),
  secret:     L.layerGroup()
};

// add non-item layers to map
Object.values(layers)
  .filter(layer => layer !== flatItemLayer)
  .forEach(layer => layer.addTo(map));

// show items as clustered
flatItemLayer.addTo(map);

// helper to load + subscribe + render each type
function initLayer(loadFn, subscribeFn, layerKey, renderFn) {
  loadFn(db).then(defs => renderFn(defs, layers[layerKey]));
  subscribeFn(db, defs => renderFn(defs, layers[layerKey]));
}

// import render functions from markerManager
import {
  renderItems,
  renderChests,
  renderQuests,
  renderNpcs,
  renderSpawnpoints,
  renderTeleports,
  renderExtractions,
  renderDoors,
  renderGates,
  renderMisc,
  renderSecrets
} from "./modules/map/marker/markerManager.js";

// wire each layer’s load + subscribe
initLayer(loadItems, subscribeItems,           "item",       renderItems);
initLayer(loadChests, subscribeChests,         "chest",      renderChests);
initLayer(loadQuests, subscribeQuests,         "quest",      renderQuests);
initLayer(loadNpcs, subscribeNpcs,             "npc",        renderNpcs);
initLayer(loadSpawnpoints, subscribeSpawnpoints, "spawnpoint", renderSpawnpoints);
initLayer(loadTeleports, subscribeTeleports,   "teleport",   renderTeleports);
initLayer(loadExtractions, subscribeExtractions, "extraction", renderExtractions);
initLayer(loadDoors, subscribeDoors,           "door",       renderDoors);
initLayer(loadGates, subscribeGates,           "gate",       renderGates);
initLayer(loadMisc, subscribeMisc,             "misc",       renderMisc);
initLayer(loadSecrets, subscribeSecrets,       "secret",     renderSecrets);
