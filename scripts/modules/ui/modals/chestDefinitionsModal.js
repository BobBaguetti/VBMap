/* =========================================================
   VBMap – Chest Definitions Modal (shell)
   ---------------------------------------------------------
   @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
   @version: 3.3  (2025‑05‑08)
   ========================================================= */

   import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
   import { createChestFormController }    from "../forms/controllers/chestFormController.js";
   import { renderChestEntry }             from "../entries/chestEntryRenderer.js";
   
   import { initializeFirebase }           from "../../services/firebaseService.js";
   import { firebaseConfig }               from "../../../../src/firebaseConfig.js";  // named export
   
   import {
     loadChestDefinitions,
     saveChestDefinition,
     deleteChestDefinition
   } from "../../services/chestDefinitionsService.js";
   
   /* Firestore handle */
   const db = initializeFirebase(firebaseConfig);
   
   /* Build shell (no preview for now) */
   const shell = createDefinitionModalShell({
     id: "chest-def-shell",
     title: "Manage Chests",
     loadAll: () => loadChestDefinitions(db),
     upsert : def => saveChestDefinition(db, def.id, def),
     remove : id  => deleteChestDefinition(db, id),
     createFormController: cb => createChestFormController(cb, db),
     renderEntry: (def, layout, handlers) => renderChestEntry(def, layout, handlers)
   });
   
   /* Public API */
   export function openChestDefinitionsModal() { shell.open(); }
   
   /* Back‑compat alias for sidebar */
   export const initChestDefinitionsModal = () => ({ open: openChestDefinitionsModal });
   