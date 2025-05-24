// @file: src/modules/definition/types.js
// @version: 1.5 — use createPreviewPanel for modal previews

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
import {
  loadNpcDefinitions,
  subscribeNpcDefinitions,
  saveNpcDefinition,
  deleteNpcDefinition
} from "../services/npcDefinitionsService.js";

import { itemSchema }  from "./schemas/itemSchema.js";
import { chestSchema } from "./schemas/chestSchema.js";
import { npcSchema }   from "./schemas/npcSchema.js";

import { buildForm }            from "./form/definitionFormBuilder.js";
import { createFormController } from "./form/definitionFormController.js";
import { createPreviewPanel }   from "./preview/createPreviewPanel.js";

export const definitionTypes = {
  Item: {
    schema:     itemSchema,
    loadDefs:   loadItemDefinitions,
    subscribeDefinitions: subscribeItemDefinitions,
    save:       saveItemDefinition,
    del:        deleteItemDefinition,
    buildForm:  () => buildForm(itemSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(itemSchema), itemSchema, handlers),
    previewBuilder: host =>
      createPreviewPanel("item", host)
  },

  Chest: {
    schema:     chestSchema,
    loadDefs:   loadChestDefinitions,
    subscribeDefinitions: subscribeChestDefinitions,
    save:       saveChestDefinition,
    del:        deleteChestDefinition,
    buildForm:  () => buildForm(chestSchema),
    controller: (handlers, db) =>
                  createFormController(buildForm(chestSchema), chestSchema, handlers),
    previewBuilder: host =>
      createPreviewPanel("chest", host)
  },

  NPC: {
    schema:        npcSchema,
    loadDefs:      loadNpcDefinitions,
    subscribeDefinitions: subscribeNpcDefinitions,
    save:          saveNpcDefinition,
    del:           deleteNpcDefinition,
    buildForm:     () => buildForm(npcSchema),
    controller:    (handlers, db) =>
                      createFormController(buildForm(npcSchema), npcSchema, handlers),
    previewBuilder: host =>
      createPreviewPanel("npc", host)
  }
};
