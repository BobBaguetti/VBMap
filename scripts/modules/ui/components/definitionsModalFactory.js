// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 2.0 – merged live subscriptions, toolbar & layoutOptions

import { createDefinitionModalShell }   from "./definitionModalShell.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import { createDefinitionListManager }  from "./definitionListManager.js";

/**
 * @typedef DefinitionModalConfig
 * @property {string} id
 * @property {string} title
 * @property {string|null} [previewType]
 * @property {object} db
 * @property {() => Promise<Array<Object>>} loadDefs
 * @property {(db:object, id:string|null, payload:Object) => Promise<Object>} saveDef
 * @property {(db:object, id:string, payload:Object) => Promise<Object>} updateDef
 * @property {(db:object, id:string) => Promise<void>} deleteDef
 * @property {(callback: (defs:Array<Object>) => void) => () => void} [subscribeDefs]
 *   // Optional: receives a listener that gets the fresh defs array, returns an unsubscribe fn
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
 * @property {Array<{ icon?: string, label: string, onClick: () => void }>} [toolbar]
 *   // Optional: toolbar buttons to render in the modal header
 * @property {Array<string>} [layoutOptions]
 *   // Optional: override layout toggles (e.g. ["row","stacked","gallery"])
 */

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
 * Exposes:
 *   - open(): Promise<void>
 *   - refresh(): Promise<void>
 */
export function createDefinitionsModal(config) {
  const {
    id, title, previewType = null, db,
    loadDefs, saveDef, updateDef, deleteDef,
    subscribeDefs,
    createFormController, renderEntry,
    enhanceHeader, toolbar, layoutOptions
  } = config;

  let shell, listApi, formApi, previewApi;
  let unsubscribe;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadDefs();
    listApi.refresh(definitions);
  }

  function startSubscription() {
    if (typeof subscribeDefs !== "function") return;
    unsubscribe?.();
    unsubscribe = subscribeDefs(newDefs => {
      definitions = newDefs;
      listApi.refresh(definitions);
    });
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) Create modal shell (with toolbar/layoutOptions if provided)
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: true,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap } = shell;

    // 2) Instantiate the form controller
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

    // 3) Move the form’s sub-header into the modal header
    const subHeader = formApi.getSubHeaderElement();
    if (subHeader) {
      subHeader.style.marginLeft = "auto";
      header.appendChild(subHeader);
    } else {
      console.warn(`Sub-header not found for modal '${id}'.`);
    }

    // 4) Allow extra header controls
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
      const live = formApi.getCurrent();
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
        _showEditButtons();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
        _showAddButtons();
      }
    });
  }

  function _showAddButtons() {
    formApi.showAdd?.();
  }

  function _showEditButtons() {
    formApi.showEdit?.();
  }

  return {
    async open() {
      await buildIfNeeded();

      // start live updates if requested, otherwise just one-time load
      if (subscribeDefs) {
        startSubscription();
      } else {
        await refreshDefinitions();
      }

      formApi.reset();
      shell.open();
      formApi.initPickrs?.();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => previewApi.show());
    },

    // Manual refresh when you don't need subscriptions
    refresh: refreshDefinitions,

    // If you subscribed, allow external teardown
    destroy: () => {
      unsubscribe?.();
      shell?.close?.();
    }
  };
}
