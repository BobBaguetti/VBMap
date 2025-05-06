// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 1.5 – slimmed down: uses controllers’ own forms instead of rebuilding fields

import { createDefinitionModalShell }   from "./definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";

/**
 * @typedef DefinitionModalConfig
 * @property {string} id
 * @property {string} title
 * @property {string} previewType
 * @property {object} db
 * @property {() => Promise<Array<Object>>} loadDefs
 * @property {(db:object, id:string|null, payload:Object) => Promise<Object>} saveDef
 * @property {(db:object, id:string, payload:Object) => Promise<Object>} updateDef
 * @property {(db:object, id:string) => Promise<void>} deleteDef
 * @property {(callbacks:Object) => { 
 *   form: HTMLFormElement, 
 *   fields: Object, 
 *   reset(): void, 
 *   populate(def:Object): void, 
 *   getCurrent(): Object, 
 *   getSubHeaderElement(): HTMLElement, 
 *   initPickrs?(): void 
 * }} createFormController
 * @property {(def:Object, layout:string, callbacks:Object) => HTMLElement} renderEntry
 * @property {(headerEl:HTMLElement, api:Object) => void} [enhanceHeader]
 */

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
 * Exposes:
 *   - open(): Promise<void>
 *   - refresh(): Promise<void>
 */
export function createDefinitionsModal(config) {
  const {
    id, title, previewType, db,
    loadDefs, saveDef, updateDef, deleteDef,
    createFormController, renderEntry,
    enhanceHeader
  } = config;

  let shell, listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadDefs();
    listApi.refresh(definitions);
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) Create modal shell (title, layout toggles, search, close, preview panel)
    shell = createDefinitionModalShell({ id, title, withPreview: true, previewType });
    const { header, bodyWrap } = shell;

    // 2) Instantiate the form controller (builds its own form + sub-header)
    formApi = createFormController({
      onCancel: async () => {
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onSubmit: async payload => {
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

    // 3) Pull the form’s sub-header into the modal header (aligned right)
    const subHeader = formApi.getSubHeaderElement();
    if (subHeader && subHeader.style) {
      subHeader.style.marginLeft = "auto";
      header.appendChild(subHeader);
    } else {
      console.warn(`Sub-header not found for modal '${id}'.`);
    }

    // 4) Allow wrapper to add extra header controls
    enhanceHeader?.(header, { shell, formApi });

    // 5) Build and insert the list container
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

    // 6) Insert the controller’s own form element
    previewApi = shell.previewApi;
    formApi.form.classList.add("ui-scroll-float");
    bodyWrap.appendChild(formApi.form);

    // 7) Live preview on form input
    formApi.form.addEventListener("input", () => {
      const live = formApi.getCurrent?.();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });

    // 8) Wire up the definitions list manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      renderEntry,
      onEntryClick: async def => {
        formApi.populate(def);
        previewApi.setFromDefinition(def);
        previewApi.show();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
      }
    });
  }

  return {
    open: async () => {
      await buildIfNeeded();
      formApi.reset();
      await refreshDefinitions();
      shell.open();
      formApi.initPickrs?.();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => previewApi.show());
    },
    refresh: refreshDefinitions
  };
}
