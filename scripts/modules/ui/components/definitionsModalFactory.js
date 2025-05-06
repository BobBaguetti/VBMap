// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 1.0 – generic factory for all definition-type modals

import { createDefinitionModalShell }    from "./definitionModalShell.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import { createDefinitionListManager }  from "./definitionListManager.js";

/**
 * @typedef DefinitionModalConfig
 * @property {string} id                  – unique modal DOM id
 * @property {string} title               – modal title text
 * @property {string} previewType         – preview panel type (e.g. "item", "chest")
 * @property {object} db                  – initialized Firestore instance
 * @property {() => Promise<Array<Object>>} loadDefs
 * @property {(db:object, id:string|null, payload:Object) => Promise<Object>} saveDef
 * @property {(db:object, id:string, payload:Object) => Promise<Object>} updateDef
 * @property {(db:object, id:string) => Promise<void>} deleteDef
 * @property {(callbacks:Object) => FormController} createFormController
 * @property {(def:Object, layout:string, callbacks:Object) => HTMLElement} renderEntry
 */

/**
 * Builds and returns an API for a full CRUD modal:
 *   { open():Promise, refresh():Promise }
 * 
 * Expects a config object matching DefinitionModalConfig.
 */
export function createDefinitionsModal(config) {
  const {
    id,
    title,
    previewType,
    db,
    loadDefs,
    saveDef,
    updateDef,
    deleteDef,
    createFormController,
    renderEntry
  } = config;

  let shell, listApi, formApi, previewApi;
  let definitions = [];

  // Load latest definitions and refresh list
  async function refreshDefinitions() {
    definitions = await loadDefs();
    listApi.refresh(definitions);
  }

  async function buildIfNeeded() {
    if (shell) return;

    // create shell: modal dialog + header + body container
    shell = createDefinitionModalShell({
      id,
      title,
      withPreview: true,
      previewType
    });

    // create list container, preview panel, and form controller
    const listContainer = createDefListContainer(`${id}-list`);
    shell.bodyWrap.appendChild(listContainer);
    shell.bodyWrap.appendChild(document.createElement("hr"));

    previewApi = shell.previewApi;
    formApi    = createFormController({
      onCancel: () => {
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onDelete: async (defId) => {
        await deleteDef(db, defId);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onSubmit: async (payload) => {
        if (payload.id) {
          await updateDef(db, payload.id, payload);
        } else {
          await saveDef(db, null, payload);
        }
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      }
    });

    // add form element into modal body
    formApi.form.classList.add("ui-scroll-float");
    shell.bodyWrap.appendChild(formApi.form);

    // wire live preview on any form input
    formApi.form.addEventListener("input", () => {
      const live = formApi.getCurrent?.();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });

    // list manager: renders entries and handles click/delete
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      renderEntry,
      onEntryClick: async (def) => {
        formApi.populate(def);
        previewApi.setFromDefinition(def);
        previewApi.show();
      },
      onDelete: async (defId) => {
        await deleteDef(db, defId);
        await refreshDefinitions();
      }
    });
  }

  return {
    /**
     * Opens the modal, rebuilding DOM on first call and reloading data each time.
     */
    open: async () => {
      await buildIfNeeded();
      formApi.reset();
      await refreshDefinitions();
      shell.open();
      formApi.initPickrs?.();
      previewApi.setFromDefinition({});
      // position & show preview after render
      requestAnimationFrame(() => {
        shell.layoutSwitcher && shell.layoutSwitcher; // no-op, ensures layoutSwitcher exists
        previewApi.show();
      });
    },

    /**
     * Exposed for external actions (e.g. real-time subscription updates).
     */
    refresh: refreshDefinitions
  };
}
