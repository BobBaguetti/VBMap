// @file: src/modules/map/markerManager.js
// @version: 11.0 — split out popups, icons, utils into dedicated modules

import { createMarker }      from "./marker/icons/createMarker.js";
import { renderItemPopup }   from "./marker/popups/itemPopup.js";
import { renderChestPopup }  from "./marker/popups/chestPopup.js";
import { createCustomIcon }  from "./marker/icons/createCustomIcon.js";
import { CHEST_RARITY }      from "./marker/utils.js";
import { rarityColors, defaultNameColor } from "../../shared/utils/color/colorPresets.js";

export {
  createMarker,
  renderItemPopup,
  renderChestPopup,
  createCustomIcon,
  CHEST_RARITY,
  rarityColors,
  defaultNameColor
};
