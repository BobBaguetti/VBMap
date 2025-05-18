// @file: src/modules/definition/types.js
// @version: 1.4 — removed old buildForm/controller entries; use schema + previewBuilder only

import {
  loadItemDefinitions,
  subscribeItemDefinitions,
  saveItemDefinition,
  deleteItemDefinition
} from "../services/itemDefinitionsService.js";
import {
  loadChestDefinitions,
  subscribeChestDefinitions,
  saveChestDefinition,
  deleteChestDefinition
} from "../services/chestDefinitionsService.js";

import { itemSchema }  from "./schemas/itemSchema.js";
import { chestSchema } from "./schemas/chestSchema.js";

import { createPreviewController } from "./preview/previewController.js";

export const definitionTypes = {
  Item: {
    schema:     itemSchema,
    loadDefs:   loadItemDefinitions,
    subscribe:  subscribeItemDefinitions,
    save:       saveItemDefinition,
    del:        deleteItemDefinition,
    previewBuilder: host =>
      createPreviewController("item", host)
  },

  Chest: {
    schema:     chestSchema,
    loadDefs:   loadChestDefinitions,
    subscribe:  subscribeChestDefinitions,
    save:       saveChestDefinition,
    del:        deleteChestDefinition,
    previewBuilder: host =>
      createPreviewController("chest", host)
  }
};
