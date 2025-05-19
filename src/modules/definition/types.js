// @file: src/modules/definition/types.js
// @version: 1.4 — standardized service API names and unified save logic

import {
  getDefinitions,
  subscribeDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition
} from "../services/itemDefinitionsService.js";

import {
  getDefinitions as getChestDefinitions,
  subscribeDefinitions as subscribeChestDefinitions,
  createDefinition as createChestDefinition,
  updateDefinition as updateChestDefinition,
  deleteDefinition as deleteChestDefinition
} from "../services/chestDefinitionsService.js";

import { itemSchema }  from "./schemas/itemSchema.js";
import { chestSchema } from "./schemas/chestSchema.js";

import { buildForm }            from "./forms/definitionFormBuilder.js";
import { createFormController } from "./forms/definitionFormController.js";
import { createPreviewController } from "./preview/previewController.js";

export const definitionTypes = {
  Item: {
    schema:    itemSchema,
    loadDefs:  getDefinitions,
    subscribe: subscribeDefinitions,
    save:      (db, id, payload) =>
                 id
                   ? updateDefinition(db, id, payload)
                   : createDefinition(db, payload),
    del:       deleteDefinition,
    controller: (handlers, db) =>
                  createFormController(buildForm(itemSchema), itemSchema, handlers),
    previewBuilder: host =>
      createPreviewController("item", host)
  },

  Chest: {
    schema:    chestSchema,
    loadDefs:  getChestDefinitions,
    subscribe: subscribeChestDefinitions,
    save:      (db, id, payload) =>
                 id
                   ? updateChestDefinition(db, id, payload)
                   : createChestDefinition(db, payload),
    del:       deleteChestDefinition,
    controller: (handlers, db) =>
                  createFormController(buildForm(chestSchema), chestSchema, handlers),
    previewBuilder: host =>
      createPreviewController("chest", host)
  }
};
