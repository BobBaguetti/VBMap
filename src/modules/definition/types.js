// @file: src/modules/definition/types.js
// @version: 1.2 — hook up generic definition modal & schema-driven forms

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

import { buildForm }            from "./forms/definitionFormBuilder.js";
import { createFormController } from "./forms/definitionFormController.js";

export const definitionTypes = {
  Item: {
    schema:     itemSchema,
    loadDefs:   loadItemDefinitions,
    subscribe:  subscribeItemDefinitions,
    save:       saveItemDefinition,
    del:        deleteItemDefinition,
    buildForm:  () => buildForm(itemSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(itemSchema), itemSchema, handlers)
  },

  Chest: {
    schema:     chestSchema,
    loadDefs:   loadChestDefinitions,
    subscribe:  subscribeChestDefinitions,
    save:       saveChestDefinition,
    del:        deleteChestDefinition,
    buildForm:  () => buildForm(chestSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(chestSchema), chestSchema, handlers)
  }
};
