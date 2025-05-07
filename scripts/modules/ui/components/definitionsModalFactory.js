// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 3.4 – complete logic with previewType integrated

import { createDefinitionModalShell } from "./definitionModalShell.js";
import { buildModalHeader }         from "./modalHeader.js";
import { createDefListContainer }    from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";
import { defaultSearchPlaceholder }  from "./modalDefaults.js";

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
 *
 * @param {object} config
 * @param {string} config.id
 * @param {string} config.title
 * @param {"item"|"chest"} [config.previewType]
 * @param {Firestore} config.db
 * @param {() => Promise<Array>} config.loadDefs
 * @param {(db,id,payload) => Promise} config.saveDef
 * @param {(db,id,payload) => Promise} config.updateDef
 * @param {(db,id) => Promise} config.deleteDef
 * @param {(cb) => Function} [config.subscribeDefs]
 * @param {(callbacks) => Object} config.createFormController
 * @param {Function} config.renderEntry
 * @param {Function} [config.enhanceHeader]
 * @param {Array} [config.toolbar]
 * @param {Array<string>} [config.layoutOptions]
 */
export function createDefinitionsModal(config) {
  const {
    id,
    title,
    previewType      = null,
    db,
    loadDefs,
    saveDef,
    updateDef,
    deleteDef,
    subscribeDefs,
    createFormController,
    renderEntry,
    enhanceHeader,
    toolbar           = [],
    layoutOptions     = []
  } = config;

  let shell, listApi, formApi, previewApi, unsubscribe, definitions = [];

  async function refreshDefinitions() {
    definitions = await loadDefs();
    listApi.refresh(definitions);
  }

  function startSubscription() {
    if (typeof subscribeDefs !== "function") return;
    unsubscribe?.();
    unsubscribe = subscribeDefs(defs => {
      definitions = defs;
      listApi.refresh(definitions);
    });
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) Core shell with preview support
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      layoutOptions,
      withPreview: true,
      previewType,
      onClose: () => previewApi?.hide()
    });
    const { header, bodyWrap } = shell;

    // 2) Search input
    const searchContainer = document.createElement("div");
    searchContainer.className = "modal-search";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = defaultSearchPlaceholder;
    searchInput.className = "ui-input";
    searchContainer.appendChild(searchInput);

    // 3) Build header
    buildModalHeader(header, {
      title,
      toolbar,
      layoutOptions,
      onLayoutChange: view => listApi.setLayout(view),
      searchEl: searchContainer
    });
    enhanceHeader?.(header, { shell, formApi });

    // 4) Form controller + sub-header
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
        formApi.showAdd?.();
      },
      onSubmit: async payload => {
        if (payload.id) await updateDef(db, payload.id, payload);
        else await saveDef(db, null, payload);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      }
    });
    const subHeaderEl = formApi.getSubHeaderElement();
    subHeaderEl.classList.add("modal-subheader");

    // 5) Body: list + divider + sub-header
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(subHeaderEl);

    // 6) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      renderEntry,
      onEntryClick: async def => {
        formApi.populate(def);
        previewApi.setFromDefinition(def);
        previewApi.show();
        formApi.showEdit?.();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
        formApi.showAdd?.();
      },
      showSearch: false
    });
    shell.listApi = listApi;

    // 7) Wire up search filtering
    searchInput.addEventListener("input", () => {
      listApi.refresh(definitions);
    });

    // 8) Append form and hook live preview
    previewApi = shell.previewApi;
    formApi.form.classList.add("ui-scroll-float");
    bodyWrap.appendChild(formApi.form);
    formApi.form.addEventListener("input", () => {
      const live = formApi.getCurrent();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });

    // No footer by design
  }

  return {
    async open() {
      await buildIfNeeded();
      subscribeDefs ? startSubscription() : await refreshDefinitions();
      formApi.reset();
      shell.open();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => previewApi.show());
    },
    refresh: refreshDefinitions,
    destroy: () => {
      unsubscribe?.();
      shell?.close?.();
    }
  };
}
