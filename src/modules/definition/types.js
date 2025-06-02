// @file: src/modules/definition/types.js
// @version: 1.5 — inject allItems into lootPool chip-lists after controller creation

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
import { createPreviewController } from "./preview/previewController.js";

// Helper for injecting item‐definitions into a chipList field
async function injectItemsIntoChipList(controller, db) {
  try {
    const items = await loadItemDefinitions(db);
    if (controller.fields.lootPool?.setAllItems) {
      controller.fields.lootPool.setAllItems(items);
    }
  } catch (e) {
    console.error("Failed to load item definitions for lootPool:", e);
  }
}

// Helper for injecting chest‐definitions into NPC’s chipList (if NPC uses “lootPool”)
async function injectChestsIntoChipList(controller, db) {
  try {
    const chests = await loadChestDefinitions(db);
    if (controller.fields.lootPool?.setAllItems) {
      controller.fields.lootPool.setAllItems(chests);
    }
  } catch (e) {
    console.error("Failed to load chest definitions for NPC lootPool:", e);
  }
}

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
      createPreviewController("item", host)
  },

  Chest: {
    schema:     chestSchema,
    loadDefs:   loadChestDefinitions,
    subscribeDefinitions: subscribeChestDefinitions,
    save:       saveChestDefinition,
    del:        deleteChestDefinition,
    buildForm:  () => buildForm(chestSchema),
    controller: (handlers, db) => {
      // 1) Build the form controller
      const ctrl = createFormController(buildForm(chestSchema), chestSchema, handlers);
      // 2) Immediately inject all item definitions into lootPool chip-list
      injectItemsIntoChipList(ctrl, db);
      return ctrl;
    },
    previewBuilder: host =>
      createPreviewController("chest", host)
  },

  NPC: {
    schema:        npcSchema,
    loadDefs:      loadNpcDefinitions,
    subscribeDefinitions: subscribeNpcDefinitions,
    save:          saveNpcDefinition,
    del:           deleteNpcDefinition,
    buildForm:     () => buildForm(npcSchema),
    controller:    (handlers, db) => {
      const ctrl = createFormController(buildForm(npcSchema), npcSchema, handlers);
      // If your NPC schema also uses “lootPool” (e.g. to pick chests), inject chest definitions
      injectChestsIntoChipList(ctrl, db);
      return ctrl;
    },
    previewBuilder: host =>
      createPreviewController("npc", host)
  }
};
