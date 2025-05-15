// @file: src/modules/map/marker/markerManager.js
// @version: 12.0 — added render functions for all new marker types

import { createMarker } from "./icons/createMarker.js";
import { createCustomIcon } from "./icons/createCustomIcon.js";

import { renderItemPopup } from "./popups/itemPopup.js";
import { renderChestPopup } from "./popups/chestPopup.js";
import { renderQuestPopup } from "./popups/questPopup.js";
import { renderNpcPopup } from "./popups/npcPopup.js";
import { renderSpawnpointPopup } from "./popups/spawnpointPopup.js";
import { renderTeleportPopup } from "./popups/teleportPopup.js";
import { renderExtractionPopup } from "./popups/extractionPopup.js";
import { renderDoorPopup } from "./popups/doorPopup.js";
import { renderGatePopup } from "./popups/gatePopup.js";
import { renderMiscPopup } from "./popups/miscPopup.js";
import { renderSecretPopup } from "./popups/secretPopup.js";

import { CHEST_RARITY } from "./utils.js";
import { rarityColors, defaultNameColor } from "../../utils/colorPresets.js";

/**
 * Generic renderer factory for a type.
 * @param {Array<Object>} defs
 * @param {L.LayerGroup} layerGroup
 * @param {(def:Object)=>L.Icon} iconFn
 * @param {(def:Object)=>string} popupFn
 */
function renderType(defs, layerGroup, iconFn, popupFn) {
  layerGroup.clearLayers();
  defs.forEach(def => {
    const icon = iconFn(def);
    const marker = createMarker(def, icon, popupFn(def));
    layerGroup.addLayer(marker);
  });
}

/** Exported render functions used in appInit.js */
export function renderItems(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderItemPopup);
}

export function renderChests(defs, layerGroup) {
  renderType(
    defs,
    layerGroup,
    def => createCustomIcon(def.imageSmall || def.imageLarge),
    renderChestPopup
  );
}

export function renderQuests(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderQuestPopup);
}

export function renderNpcs(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderNpcPopup);
}

export function renderSpawnpoints(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderSpawnpointPopup);
}

export function renderTeleports(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderTeleportPopup);
}

export function renderExtractions(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderExtractionPopup);
}

export function renderDoors(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderDoorPopup);
}

export function renderGates(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderGatePopup);
}

export function renderMisc(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderMiscPopup);
}

export function renderSecrets(defs, layerGroup) {
  renderType(defs, layerGroup, def => createCustomIcon(def.iconSmallUrl), renderSecretPopup);
}

/** Re-export utilities for other modules */
export {
  createMarker,
  createCustomIcon,
  CHEST_RARITY,
  rarityColors,
  defaultNameColor
};
