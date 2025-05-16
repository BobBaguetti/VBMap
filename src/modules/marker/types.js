// @file: src/modules/marker/types.js
// @version: 1.1 — corrected formBuilder imports to match actual exports

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

// Import builder functions by their actual exported names
import { createItemForm } from "../ui/forms/builders/itemFormBuilder.js";
import { createChestForm } from "../ui/forms/builders/chestFormBuilder.js";

import { itemFormController } from "../ui/forms/controllers/itemFormController.js";
import { chestFormController } from "../ui/forms/controllers/chestFormController.js";

import { setupItemFilters } from "../sidebar/filters/itemFilters.js";
import { setupChestFilters } from "../sidebar/filters/chestFilters.js";

export const markerTypes = {
  Item: {
    loadDefinitions:        loadItemDefinitions,
    subscribeDefinitions:   subscribeItemDefinitions,
    formBuilder:            createItemForm,      // was itemFormBuilder
    formController:         itemFormController,
    modalInit:              initItemDefinitionsModal,
    popupRenderer:          renderItemPopup,
    iconFactory:            createCustomIcon,
    filterSetup:            setupItemFilters,
    showInSidebar:          def => def.showInFilters,
  },
  Chest: {
    loadDefinitions:        loadChestDefinitions,
    subscribeDefinitions:   subscribeChestDefinitions,
    formBuilder:            createChestForm,     // was chestFormBuilder
    formController:         chestFormController,
    modalInit:              initChestDefinitionsModal,
    popupRenderer:          renderChestPopup,
    iconFactory:            createCustomIcon,
    filterSetup:            setupChestFilters,
    showInSidebar:          () => true,
  },
  // Future types (NPC, Quest, Secret, Misc) can be added here
};
