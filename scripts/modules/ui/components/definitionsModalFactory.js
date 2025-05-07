// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 2.4 – suppress list’s built-in search (use only header search)

import { createDefinitionModalShell } from "./definitionModalShell.js";
import { createDefListContainer, createSearchRow } from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";
import {
  defaultToolbar,
  defaultLayoutOptions,
  defaultSearchPlaceholder,
  renderToolbarButton
} from "./modalDefaults.js";

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
    toolbar           = defaultToolbar,
    layoutOptions     = defaultLayoutOptions
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
    unsubscribe = subscribeDefs(defs => {
      definitions = defs;
      listApi.refresh(definitions);
    });
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) modal shell (toolbar & layout toggles)
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: true,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap } = shell;

    // render any toolbar buttons
    toolbar.forEach(cfg => renderToolbarButton(cfg, header, { shell }));

    // insert our custom header search (only one)
    const { row: searchRow, input: searchInput } =
      createSearchRow(`${id}-search`, defaultSearchPlaceholder);
    searchRow.style.marginLeft = "auto";
    header.appendChild(searchRow);

    // 2) form controller
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

    // 3) move the Add/Edit sub-header into the modal header
    const subHeader = formApi.getSubHeaderElement();
    if (subHeader) {
      subHeader.style.marginLeft = "auto";
      header.appendChild(subHeader);
    } else {
      console.warn(`Sub-header not found for modal '${id}'.`);
    }

    // 4) any extra header wiring
    enhanceHeader?.(header, { shell, formApi });

    // 5) insert list + divider
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

    // 6) suppress the list’s own search, rely on our header search instead
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
      showSearch: false    // ← turn off built-in search box
    });

    // wire our header search into the list
    searchInput.addEventListener("input", () => {
      listApi.refresh(definitions);
    });

    // 7) insert the form
    previewApi = shell.previewApi;
    formApi.form.classList.add("ui-scroll-float");
    bodyWrap.appendChild(formApi.form);

    // live preview on edits
    formApi.form.addEventListener("input", () => {
      const live = formApi.getCurrent();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });
  }

  return {
    async open() {
      await buildIfNeeded();
      if (subscribeDefs) startSubscription();
      else await refreshDefinitions();

      formApi.reset();
      shell.open();
      formApi.initPickrs?.();
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
