// @file: src/modules/definition/types.js
// @version: 1.4 — standardized service APIs; collapsed buildForm into controller

import {
  getDefinitions as getItemDefinitions,
  subscribeDefinitions as subscribeItemDefinitions,
  createDefinition as createItemDefinition,
  updateDefinition as updateItemDefinition,
  deleteDefinition as deleteItemDefinition
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
    /** Load all items once */
    getDefinitions:    getItemDefinitions,
    /** Subscribe to item updates */
    subscribeDefinitions: subscribeItemDefinitions,
    /** Create a new item */
    createDefinition:  createItemDefinition,
    /** Update existing item */
    updateDefinition:  updateItemDefinition,
    /** Delete item */
    deleteDefinition:  deleteItemDefinition,
    /** Build & wire the form/controller */
    controller: (handlers, db) =>
      createFormController(buildForm(itemSchema), itemSchema, handlers),
    /** Create the right preview for items */
    previewBuilder: host =>
      createPreviewController("item", host)
  },

  Chest: {
    schema:    chestSchema,
    getDefinitions:    getChestDefinitions,
    subscribeDefinitions: subscribeChestDefinitions,
    createDefinition:  createChestDefinition,
    updateDefinition:  updateChestDefinition,
    deleteDefinition:  deleteChestDefinition,
    controller: (handlers, db) =>
      createFormController(buildForm(chestSchema), chestSchema, handlers),
    previewBuilder: host =>
      createPreviewController("chest", host)
  }
};
