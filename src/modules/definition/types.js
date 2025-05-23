// @file: src/modules/definition/types.js
// @version: 1.3 — add previewBuilder for type-specific previews

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

import { buildForm }            from "./form/definitionFormBuilder.js";
import { createFormController } from "./form/definitionFormController.js";
import { createPreviewController } from "./preview/previewController.js";

export const definitionTypes = {
  Item: {
    schema:     itemSchema,
    loadDefs:   loadItemDefinitions,
    subscribe:  subscribeItemDefinitions,
    save:       saveItemDefinition,
    del:        deleteItemDefinition,
    buildForm:  () => buildForm(itemSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(itemSchema), itemSchema, handlers),
    previewBuilder: host =>
      createPreviewController("item", host)
  },

  Chest: {
    schema:     chestSchema,
    loadDefs:   loadChestDefinitions,
    subscribe:  subscribeChestDefinitions,
    save:       saveChestDefinition,
    del:        deleteChestDefinition,
    buildForm:  () => buildForm(chestSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(chestSchema), chestSchema, handlers),
    previewBuilder: host =>
      createPreviewController("chest", host)
  }
};
