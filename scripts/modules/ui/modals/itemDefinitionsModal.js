/* =========================================================
   VBMap – Item Definitions Modal (shell)
   ---------------------------------------------------------
   @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
   @version: 3.2  (2025‑05‑08)
   ========================================================= */

   import { createDefinitionModalShell }  from "../components/definitionModalShell.js";
   import { createItemFormController }    from "../forms/controllers/itemFormController.js";
   import { renderItemEntry }             from "../entries/itemEntryRenderer.js";
   import { createItemPreviewPanel }      from "../preview/itemPreview.js";
   
   import { initializeFirebase }          from "../../services/firebaseService.js";
   import firebaseConfig                  from "../../../src/firebaseConfig.js";
   
   import {
     loadItemDefinitions,
     saveItemDefinition,
     deleteItemDefinition
   } from "../../services/itemDefinitionsService.js";
   
   /* ── Firestore handle (singleton) ─────────────────────── */
   const db = initializeFirebase(firebaseConfig);
   
   /* ── optional preview pane ────────────────────────────── */
   const preview = createItemPreviewPanel(document.createElement("div"));
   
   /* ── shell config ─────────────────────────────────────── */
   const shell = createDefinitionModalShell({
     id: "item-def-shell",
     title: "Manage Item Types",
     loadAll: () => loadItemDefinitions(db),
     upsert : def => saveItemDefinition(db, def.id, def),
     remove : id  => deleteItemDefinition(db, id),
     createFormController: cb => createItemFormController(cb),
     renderEntry: (def, layout, handlers) => renderItemEntry(def, layout, handlers),
     previewPanel: preview
   });
   
   /* ── exported API ─────────────────────────────────────── */
   export function openItemDefinitionsModal() { shell.open(); }
   