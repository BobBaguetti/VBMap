// @file: src/modules/initializer/markerHydrator.js
// @version: 1.1 - fixed import paths

import { db, clusterItemLayer, flatItemLayer, layers } from "../../appInit.js";
import { subscribeMarkers }                            from "../services/firebaseService.js";

import createItemMarker    from "../map/markers/item/factory.js";
import renderItemPopup     from "../map/markers/item/popup.js";
import createChestMarker   from "../map/markers/chest/factory.js";
import renderChestPopup    from "../map/markers/chest/popup.js";
import createNPCMarker     from "../map/markers/npc/factory.js";
import renderNPCPopup      from "../map/markers/npc/popup.js";
import createCustomIcon    from "../map/markers/common/createCustomIcon.js";

import { itemDefMap, chestDefMap, npcDefMap }          from "./definitionsLoader.js";

/**
 * Holds all active marker instances and their data.
 * { markerObj: L.Marker, data: Object }
 */
export let allMarkers = [];

/**
 * Initializes marker subscriptions and hydration logic.
 * @param {boolean} isAdmin – flag to control admin-specific behavior
 */
export function initMarkers(isAdmin) {
  // Subscribe to raw marker docs
  subscribeMarkers(db, markers => {
    // Remove existing markers
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add new markers
    markers.forEach(data => addMarker(data));
  });

  // Rehydrate on definition updates
  document.addEventListener("definitions:updated:item",  () => rehydrateItems());
  document.addEventListener("definitions:updated:chest", () => rehydrateChests());
  document.addEventListener("definitions:updated:npc",   () => rehydrateNPCs());
}

function addMarker(data) {
  let markerObj;

  switch (data.type) {
    case "Chest": {
      const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
      const fullDef = {
        ...def,
        lootPool: def.lootPool.map(id => itemDefMap[id]).filter(Boolean)
      };
      data.chestDefFull = fullDef;
      markerObj = createChestMarker({ ...data, imageSmall: fullDef.imageSmall });
      break;
    }
    case "Item": {
      const def = itemDefMap[data.predefinedItemId] || {};
      Object.assign(data, def);
      markerObj = createItemMarker(data);
      break;
    }
    case "NPC": {
      const def = npcDefMap[data.npcDefinitionId] || {};
      Object.assign(data, def);
      markerObj = createNPCMarker(data);
      break;
    }
    default:
      return;
  }

  // Add to proper layer
  const layer = data.type === "Item" ? flatItemLayer : layers[data.type];
  layer.addLayer(markerObj);
  allMarkers.push({ markerObj, data });
}

function rehydrateItems() {
  allMarkers.forEach(({ markerObj, data }) => {
    if (data.type === "Item" && data.predefinedItemId) {
      const def = itemDefMap[data.predefinedItemId] || {};
      Object.assign(data, def);
      markerObj.setIcon(createCustomIcon(data));
      markerObj.setPopupContent(renderItemPopup(data));
    }
  });
}

function rehydrateChests() {
  allMarkers.forEach(({ markerObj, data }) => {
    if (data.type === "Chest" && data.chestTypeId) {
      const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
      const fullDef = {
        ...def,
        lootPool: def.lootPool.map(id => itemDefMap[id]).filter(Boolean)
      };
      data.chestDefFull = fullDef;
      markerObj.setPopupContent(renderChestPopup(fullDef));
    }
  });
}

function rehydrateNPCs() {
  allMarkers.forEach(({ markerObj, data }) => {
    if (data.type === "NPC" && data.npcDefinitionId) {
      const def = npcDefMap[data.npcDefinitionId] || {};
      Object.assign(data, def);
      markerObj.setPopupContent(renderNPCPopup(def));
    }
  });
}
