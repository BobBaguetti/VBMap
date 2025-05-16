/* @file: src/modules/map/markerManager.js */
/* @version: 13.0 — added NPC marker exports */

export { default as createMarker }         from "./markers/common/createMarker.js";
export { default as createCustomIcon }     from "./markers/common/createCustomIcon.js";
export { wrapPopup }                       from "./markers/common/popupBase.js";

export { default as createChestMarker }    from "./markers/chest/factory.js";
export { default as renderChestPopup }     from "./markers/chest/popup.js";

export { default as createItemMarker }     from "./markers/item/factory.js";
export { default as renderItemPopup }      from "./markers/item/popup.js";

export { default as createNPCMarker }      from "./markers/npc/factory.js";
export { default as renderNPCPopup }       from "./markers/npc/popup.js";

export * from "./markers/utils.js";
