// @file: src/modules/marker/types.js
// @version: 1.5 — switch to unified definition schema & modal

import {
  loadItemDefinitions,
  subscribeItemDefinitions,
} from "../services/itemDefinitionsService.js";
import {
  loadChestDefinitions,
  subscribeChestDefinitions,
} from "../services/chestDefinitionsService.js";

import {
  renderItemPopup,
  renderChestPopup,
  createCustomIcon,
} from "../map/markerManager.js";

import { definitionTypes } from "../definition/types.js";
import { setupItemFilters }  from "../sidebar/filters/itemFilters.js";
import { setupChestFilters } from "../sidebar/filters/chestFilters.js";

export const markerTypes = {
  Item: {
    defIdKey:             "predefinedItemId",
    loadDefinitions:      definitionTypes.Item.loadDefs,
    subscribeDefinitions: definitionTypes.Item.subscribe,
    // we no longer have per-type modals or form builders/controllers here
    popupRenderer:        renderItemPopup,
    iconFactory:          createCustomIcon,
    filterSetup:          setupItemFilters,
    showInSidebar:        def => def.showInFilters,
  },

  Chest: {
    defIdKey:             "chestTypeId",
    loadDefinitions:      definitionTypes.Chest.loadDefs,
    subscribeDefinitions: definitionTypes.Chest.subscribe,
    popupRenderer:        renderChestPopup,
    iconFactory:          createCustomIcon,
    filterSetup:          setupChestFilters,
    showInSidebar:        () => true,
  }
  // … future types can be added here …
};
