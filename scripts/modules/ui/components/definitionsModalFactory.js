// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 3.6 – single wired search in header

import { createDefinitionModalShell } from "./definitionModalShell.js";
import { buildModalHeader }         from "./modalHeader.js";
import { createDefListContainer }    from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";
import { createSearchRow }           from "../../utils/listUtils.js";

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
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

    // 1) Core shell + preview
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

    // 2) Header: toolbar + layout only
    buildModalHeader(header, {
      toolbar,
      layoutOptions,
      onLayoutChange: v => listApi?.setLayout(v)
    });

    // 3) Header: searchRow (wired)
    const { row: searchRow, input: searchInput } = createSearchRow(
      `${id}-search`,
      "Search…"
    );
    searchRow.classList.add("modal-search");
    header.appendChild(searchRow);

    // 4) Header: Add/Edit sub-header
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
    header.appendChild(subHeaderEl);

    enhanceHeader?.(header, { shell, formApi });

    // 5) Body: list + divider
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

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
      showSearch: false  // we use our header search instead
    });
    shell.listApi = listApi;

    // 6) Wire header search into the list
    searchInput.addEventListener("input", () => {
      listApi.refresh(definitions);
    });

    // 7) Body: form + live preview
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

    // no footer
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
