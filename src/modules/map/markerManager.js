/* @file: src/modules/map/markerManager.js */
/* @version: 13.2 — fixed default vs. named exports for marker modules */

import createMarker         from "./markers/common/createMarker.js";
import createCustomIcon     from "./markers/common/createCustomIcon.js";
import { wrapPopup }        from "./markers/common/popupBase.js";

import createChestMarker    from "./markers/chest/factory.js";
import renderChestPopup     from "./markers/chest/popup.js";

import createItemMarker     from "./markers/item/factory.js";
import renderItemPopup      from "./markers/item/popup.js";

import createNPCMarker      from "./markers/npc/factory.js";
import renderNPCPopup       from "./markers/npc/popup.js";

import { CHEST_RARITY }     from "./markers/utils.js";
import { rarityColors, defaultNameColor } from "../utils/colorPresets.js";

// Re-exports
export {
  createMarker,
  createCustomIcon,
  wrapPopup,

  createChestMarker,
  renderChestPopup,

  createItemMarker,
  renderItemPopup,

  createNPCMarker,
  renderNPCPopup,

  CHEST_RARITY,
  rarityColors,
  defaultNameColor
};
