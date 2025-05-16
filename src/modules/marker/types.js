// @file: src/modules/marker/types.js
// @version: 1.4 — added defIdKey for marker instance payloads

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

import { initItemDefinitionsModal } from "../ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal } from "../ui/modals/chestDefinitionsModal.js";

import { createItemForm } from "../ui/forms/builders/itemFormBuilder.js";
import { createChestForm } from "../ui/forms/builders/chestFormBuilder.js";

import { createItemFormController } from "../ui/forms/controllers/itemFormController.js";
import { createChestFormController } from "../ui/forms/controllers/chestFormController.js";

import { setupItemFilters } from "../sidebar/filters/itemFilters.js";
import { setupChestFilters } from "../sidebar/filters/chestFilters.js";

export const markerTypes = {
  Item: {
    defIdKey:              "predefinedItemId",
    loadDefinitions:       loadItemDefinitions,
    subscribeDefinitions:  subscribeItemDefinitions,
    formBuilder:           createItemForm,
    formController:        createItemFormController,
    modalInit:             initItemDefinitionsModal,
    popupRenderer:         renderItemPopup,
    iconFactory:           createCustomIcon,
    filterSetup:           setupItemFilters,
    showInSidebar:         def => def.showInFilters,
  },
  Chest: {
    defIdKey:              "chestTypeId",
    loadDefinitions:       loadChestDefinitions,
    subscribeDefinitions:  subscribeChestDefinitions,
    formBuilder:           createChestForm,
    formController:        createChestFormController,
    modalInit:             initChestDefinitionsModal,
    popupRenderer:         renderChestPopup,
    iconFactory:           createCustomIcon,
    filterSetup:           setupChestFilters,
    showInSidebar:         () => true,
  },
  // … future types here …
};
