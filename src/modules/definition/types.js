// @file: src/modules/definition/types.js
// @version: 1.4 — switched to standardized service API

import {
  getDefinitions as loadItemDefinitions,
  subscribeDefinitions as subscribeItemDefinitions,
  createDefinition as createItemDefinition,
  updateDefinition as updateItemDefinition,
  deleteDefinition as deleteItemDefinition
} from "./services/itemService.js";

import {
  getDefinitions as loadChestDefinitions,
  subscribeDefinitions as subscribeChestDefinitions,
  createDefinition as createChestDefinition,
  updateDefinition as updateChestDefinition,
  deleteDefinition as deleteChestDefinition
} from "./services/chestService.js";

import { itemSchema }  from "./schemas/itemSchema.js";
import { chestSchema } from "./schemas/chestSchema.js";

import { buildForm }            from "./forms/definitionFormBuilder.js";
import { createFormController } from "./forms/definitionFormController.js";
import { createPreviewController } from "./preview/previewController.js";

export const definitionTypes = {
  Item: {
    schema:    itemSchema,
    // Data methods
    loadDefs:  loadItemDefinitions,
    subscribe: subscribeItemDefinitions,
    save:      (db, id, data) =>
                 id
                   ? updateItemDefinition(db, id, data)
                   : createItemDefinition(db, data),
    del:       deleteItemDefinition,
    // UI hooks
    controller: (handlers, db) =>
                  createFormController(buildForm(itemSchema), itemSchema, handlers),
    previewBuilder: host =>
      createPreviewController("item", host)
  },

  Chest: {
    schema:    chestSchema,
    loadDefs:  loadChestDefinitions,
    subscribe: subscribeChestDefinitions,
    save:      (db, id, data) =>
                 id
                   ? updateChestDefinition(db, id, data)
                   : createChestDefinition(db, data),
    del:       deleteChestDefinition,
    controller: (handlers, db) =>
                  createFormController(buildForm(chestSchema), chestSchema, handlers),
    previewBuilder: host =>
      createPreviewController("chest", host)
  }
};
