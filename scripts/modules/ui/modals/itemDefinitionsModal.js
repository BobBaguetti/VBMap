/* =========================================================
   VBMap – Chest Definitions Modal (shell)
   ---------------------------------------------------------
   @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
   @version: 3.2  (2025‑05‑08)
   ========================================================= */

   import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
   import { createChestFormController }    from "../forms/controllers/chestFormController.js";
   import { renderChestEntry }             from "../entries/chestEntryRenderer.js";
   import { createChestPreviewPanel }      from "../preview/chestPreview.js";
   
   import { initializeFirebase }           from "../../services/firebaseService.js";
   import { firebaseConfig }               from "../../../../src/firebaseConfig.js";  // ← named import
   
   import {
     loadChestDefinitions,
     saveChestDefinition,
     deleteChestDefinition
   } from "../../services/chestDefinitionsService.js";
   
   /* Firestore handle */
   const db = initializeFirebase(firebaseConfig);
   
   /* Preview */
   const preview = createChestPreviewPanel(document.createElement("div"));
   
   /* Shell */
   const shell = createDefinitionModalShell({
     id: "chest-def-shell",
     title: "Manage Chest Types",
     loadAll: () => loadChestDefinitions(db),
     upsert : def => saveChestDefinition(db, def.id, def),
     remove : id  => deleteChestDefinition(db, id),
     createFormController: cb => createChestFormController(cb, db),
     renderEntry: (def, layout, handlers) => renderChestEntry(def, layout, handlers),
     previewPanel: preview
   });
   
   export function openChestDefinitionsModal() { shell.open(); }
   