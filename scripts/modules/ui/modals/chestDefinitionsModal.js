// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.0

import {
    createModal,
    openModal,
    closeModal
  } from "../uiKit.js";
  
  import { createDefListContainer } from "../../utils/listUtils.js";
  import {
    loadChestTypes,
    saveChestType,
    updateChestType,
    deleteChestType
  } from "../../services/chestTypesService.js";
  
  import { createDefinitionListManager } from "../components/definitionListManager.js";
  import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
  import { createChestFormController }   from "../forms/controllers/chestFormController.js";
  
  export function initChestDefinitionsModal(db) {
    let modal, content, header;
    let listApi, formApi, previewApi;
    let definitions = [];
  
    async function refreshDefinitions() {
      definitions = await loadChestTypes(db);
      listApi.refresh(definitions);
    }
  
    return {
      open: async () => {
        if (!modal) {
          // 1) Build modal
          const created = createModal({
            id:       "chest-definitions-modal",
            title:    "Manage Chest Types",
            size:     "large",
            backdrop: true,
            onClose:  () => {
              closeModal(modal);
              previewApi.hide();
            }
          });
          modal   = created.modal;
          content = created.content;
          header  = created.header;
          modal.classList.add("admin-only");
  
          // 2) List container + preview + form
          const listContainer = createDefListContainer("chest-def-list");
          previewApi  = createPreviewPanel("chest");
          formApi     = createChestFormController({
            onCancel:  () => { formApi.reset(); previewApi.setFromDefinition({}); previewApi.show(); },
            onDelete:  async id => {
              await deleteChestType(db, id);
              await refreshDefinitions();
              formApi.reset();
              previewApi.setFromDefinition({});
              previewApi.show();
            },
            onSubmit:  async payload => {
              if (payload.id) await updateChestType(db, payload.id, payload);
              else             await saveChestType(db, null, payload);
              await refreshDefinitions();
              formApi.reset();
              previewApi.setFromDefinition({});
              previewApi.show();
            }
          });
  
          formApi.form.classList.add("ui-scroll-float");
          formApi.form.addEventListener("input", () => {
            const live = formApi.getCustom();
            if (live) {
              previewApi.setFromDefinition(live);
              previewApi.show();
            }
          });
  
          // 3) Assemble body
          const bodyWrap = document.createElement("div");
          Object.assign(bodyWrap.style, {
            display:       "flex",
            flexDirection: "column",
            flex:          "1 1 auto",
            minHeight:     "0"
          });
          bodyWrap.appendChild(listContainer);
          bodyWrap.appendChild(document.createElement("hr"));
          bodyWrap.appendChild(formApi.form);
          content.appendChild(bodyWrap);
  
          // 4) Wiring list manager
          listApi = createDefinitionListManager({
            container:      listContainer,
            getDefinitions: () => definitions,
            onEntryClick:   def => {
              formApi.populate(def);
              previewApi.setFromDefinition(def);
              previewApi.show();
            },
            onDelete:       id => deleteChestType(db, id).then(refreshDefinitions)
          });
  
          previewApi.hide();
        }
  
        // On every open: reset, refresh, then show
        formApi.reset();
        await refreshDefinitions();
        openModal(modal);
        previewApi.setFromDefinition({});
        previewApi.show();
      }
    };
  }
  