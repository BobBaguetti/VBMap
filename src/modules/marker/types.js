// @file: src/modules/marker/types.js
// @version: 1.7 

import {
  loadItemDefinitions,
  subscribeItemDefinitions
} from "../services/itemDefinitionsService.js";
import {
  loadChestDefinitions,
  subscribeChestDefinitions
} from "../services/chestDefinitionsService.js";

import {
  renderItemPopup,
  renderChestPopup,
  createCustomIcon
} from "../map/markerManager.js";
import { setupItemFilters }  from "../sidebar/filters/itemFilters.js";
import { setupChestFilters } from "../sidebar/filters/chestFilters.js";

export const markerTypes = {
  Item: {
    defIdKey:             "predefinedItemId",
    loadDefinitions:      loadItemDefinitions,
    subscribeDefinitions: subscribeItemDefinitions,
    popupRenderer:        renderItemPopup,
    iconFactory:          createCustomIcon,
    filterSetup:          setupItemFilters,
    showInSidebar:        def => def.showInFilters
  },

  Chest: {
    defIdKey:             "chestTypeId",
    loadDefinitions:      loadChestDefinitions,
    subscribeDefinitions: subscribeChestDefinitions,
    popupRenderer:        renderChestPopup,
    iconFactory:          createCustomIcon,
    filterSetup:          setupChestFilters
  }
};
