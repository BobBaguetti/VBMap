// @file: src/modules/marker/types.js
// @version: 1.7 — add NPC marker type

import {
  loadItemDefinitions,
  subscribeItemDefinitions
} from "../services/itemDefinitionsService.js";
import {
  loadChestDefinitions,
  subscribeChestDefinitions
} from "../services/chestDefinitionsService.js";
import {
  loadNpcDefinitions,
  subscribeNpcDefinitions
} from "../services/npcDefinitionsService.js";

import {
  renderItemPopup,
  renderChestPopup,
  renderNpcPopup,
  createCustomIcon
} from "../map/markerManager.js";
import { setupItemFilters }  from "../sidebar/filters/itemFilters.js";
import { setupChestFilters } from "../sidebar/filters/chestFilters.js";
import { setupNpcFilters }   from "../sidebar/filters/npcFilters.js";

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
    // Chest filters derive from schema; no showInSidebar flag needed
  },

  NPC: {
    defIdKey:             "npcDefinitionId",
    loadDefinitions:      loadNpcDefinitions,
    subscribeDefinitions: subscribeNpcDefinitions,
    popupRenderer:        renderNpcPopup,
    iconFactory:          createCustomIcon,
    filterSetup:          setupNpcFilters,
    showInSidebar:        def => def.showInFilters
  }
};
