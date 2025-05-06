// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 2.3 – restore search bar into header alongside toolbar & layout toggles

import { createDefinitionModalShell }   from "./definitionModalShell.js";
import { createDefListContainer, createSearchRow } from "../../utils/listUtils.js";
import { createDefinitionListManager }  from "./definitionListManager.js";
import {
  defaultToolbar,
  defaultLayoutOptions,
  defaultSearchPlaceholder,
  renderToolbarButton
} from "./modalDefaults.js";

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
 * @property {Array<string>} [layoutOptions]
 */

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
 * Exposes:
 *   - open(): Promise<void>
 *   - refresh(): Promise<void>
 *   - destroy(): void
 */
export function createDefinitionsModal(config) {
  const {
    id,
    title,
    previewType = null,
    db,
    loadDefs,
    saveDef,
    updateDef,
    deleteDef,
    subscribeDefs,
    createFormController,
    renderEntry,
    enhanceHeader,
    // fall back to defaults if none passed
    toolbar = defaultToolbar,
    layoutOptions = defaultLayoutOptions
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

    // 1) Create the modal shell with toolbar & layout toggles
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: true,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap } = shell;

    // 1a) Render any toolbar buttons
    toolbar.forEach(cfg => renderToolbarButton(cfg, header, { shell }));

    // 1b) Add search row next to toolbar/layout controls
    const { row: searchRow, input: searchInput } =
      createSearchRow(`${id}-search`, defaultSearchPlaceholder);
    searchRow.style.marginLeft = "auto";
    header.appendChild(searchRow);

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

    // 4) Allow any extra header enhancements
    enhanceHeader?.(header, { shell, formApi });

    // 5) Build and insert the list container + divider
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

    // 6) Insert the form into the body
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

    // 8a) Wire the search input to re-render the list
    searchInput.addEventListener("input", () => {
      listApi.refresh(definitions);
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

      // start real-time updates or one-time load
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

    // manual refresh
    refresh: refreshDefinitions,

    // teardown if subscribed
    destroy: () => {
      unsubscribe?.();
      shell?.close?.();
    }
  };
}
