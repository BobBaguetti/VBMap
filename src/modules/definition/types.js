// @file: src/modules/definition/types.js
// @version: 1.1 — initial Item-only registry

import {
  loadItemDefinitions,
  subscribeItemDefinitions,
  saveItemDefinition,
  deleteItemDefinition
} from "../services/itemDefinitionsService.js";

import { createItemForm }             from "../ui/forms/builders/itemFormBuilder.js";
import { createItemFormController }   from "../ui/forms/controllers/itemFormController.js";

export const definitionTypes = {
  Item: {
    loadDefs:  loadItemDefinitions,
    subscribe: subscribeItemDefinitions,
    save:      saveItemDefinition,
    del:       deleteItemDefinition,
    builder:   createItemForm,
    controller:createItemFormController
  }
};
