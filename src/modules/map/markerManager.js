// @file: src/modules/map/markerManager.js
// @version: 11.3 — consolidated new markers/* structure

// Core Leaflet factories
export { default as createMarker }      from "./markers/common/createMarker.js";
export { default as createCustomIcon }  from "./markers/common/createCustomIcon.js";

// Chest
export { default as createChestMarker } from "./markers/chest/factory.js";
export { default as renderChestPopup }  from "./markers/chest/popup.js";

// Item
export { default as createItemMarker }  from "./markers/item/factory.js";
export { default as renderItemPopup }   from "./markers/item/popup.js";

// NPC
export { default as createNPCMarker }   from "./markers/npc/factory.js";
export { default as renderNPCPopup }    from "./markers/npc/popup.js";

// Shared popup base
export { default as popupBase }         from "./markers/common/popupBase.js";

// (Quest & Misc to follow…)

// Shared utils
export { CHEST_RARITY, isImgUrl, getBestImageUrl } from "./markers/utils.js";
export { rarityColors, defaultNameColor }           from "../utils/colorPresets.js";
