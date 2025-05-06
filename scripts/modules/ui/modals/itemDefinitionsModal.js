/* =========================================================
   VBMap – Item Definitions Modal (shell)
   ---------------------------------------------------------
   @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
   @version: 3.6  (2025‑05‑09)
   ========================================================= */

   import { createDefinitionModalShell }  from "../components/definitionModalShell.js";
   import { createItemFormController }    from "../forms/controllers/itemFormController.js";
   import { renderItemEntry }             from "../entries/itemEntryRenderer.js";
   
   import { initializeFirebase }          from "../../services/firebaseService.js";
   import { firebaseConfig }              from "../../../../src/firebaseConfig.js";
   
   import {
     loadItemDefinitions,
     saveItemDefinition,
     deleteItemDefinition
   } from "../../services/itemDefinitionsService.js";
   
   /* Firestore handle (singleton) */
   const db = initializeFirebase(firebaseConfig);
   
   /* Modal shell (no preview panel) */
   const shell = createDefinitionModalShell({
     id: "item-def-shell",
     title: "Manage Items",
     loadAll: () => loadItemDefinitions(db),
     upsert : def => saveItemDefinition(db, def.id, def),
     remove : id  => deleteItemDefinition(db, id),
     createFormController: cb => createItemFormController(cb),
     renderEntry: (def, layout, handlers) => renderItemEntry(def, layout, handlers)
   });
   
   export function openItemDefinitionsModal() { shell.open(); }
   