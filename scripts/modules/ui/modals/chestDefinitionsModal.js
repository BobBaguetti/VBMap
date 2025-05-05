/* =========================================================
   VBMap – Chest Definitions Modal (shell)
   ---------------------------------------------------------
   @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
   @version: 3.0  (2025‑05‑08)
   ========================================================= */

   import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
   import { createChestFormController }    from "../forms/controllers/chestFormController.js";
   import { renderChestEntry }             from "../entries/chestEntryRenderer.js";
   import { createChestPreviewPanel }      from "../preview/chestPreview.js";
   
   import { initializeFirebase }           from "../../services/firebaseService.js";
   import firebaseConfig                   from "../../../src/firebaseConfig.js";
   
   import {
     loadChestDefinitions,
     saveChestDefinition,
     deleteChestDefinition
   } from "../../services/chestDefinitionsService.js";
   
   /* ── Firestore handle (singleton) ─────────────────────── */
   const db = initializeFirebase(firebaseConfig);
   
   /* ── optional preview pane ────────────────────────────── */
   const preview = createChestPreviewPanel(document.createElement("div"));
   
   /* ── shell config ─────────────────────────────────────── */
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
   
   /* ── exported API ─────────────────────────────────────── */
   export function openChestDefinitionsModal() { shell.open(); }
   