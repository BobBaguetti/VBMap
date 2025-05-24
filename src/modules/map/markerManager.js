// @file: src/modules/map/markerManager.js
// @version: 11.1 — added NPC popup export

import { createMarker }      from "./marker/icons/createMarker.js";
import { renderItemPopup }   from "./marker/popups/itemPopup.js";
import { renderChestPopup }  from "./marker/popups/chestPopup.js";
import { renderNpcPopup }    from "./marker/popups/npcPopup.js";
import { createCustomIcon }  from "./marker/icons/createCustomIcon.js";
import { CHEST_RARITY }      from "./marker/utils.js";
import { rarityColors, defaultNameColor } from "../../shared/utils/color/colorPresets.js";

export {
  createMarker,
  renderItemPopup,
  renderChestPopup,
  renderNpcPopup,
  createCustomIcon,
  CHEST_RARITY,
  rarityColors,
  defaultNameColor
};
