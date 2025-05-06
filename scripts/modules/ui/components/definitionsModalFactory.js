// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 2.5 – sub-header moved below list instead of in title bar

import { createDefinitionModalShell }  from "./definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";
import {
  defaultToolbar,
  defaultLayoutOptions,
  renderToolbarButton
} from "./modalDefaults.js";

/**
 * Builds a full CRUD modal with consistent shell, list, preview, and form.
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
    toolbar       = defaultToolbar,
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

    // 1) create the shell (backdrop, header, close-button, layout toggles)
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: true,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap } = shell;

    // 1a) render toolbar icons into header (before close ×)
    toolbar.forEach(cfg => renderToolbarButton(cfg, header, { shell }));

    // 2) instantiate the form controller
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

    // 3) prepare list container
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);

    // 4) wire up the list manager (it auto-injects its own search header)
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
      }
    });

    // 5) divider below list
    bodyWrap.appendChild(document.createElement("hr"));

    // 6) move the Add/Edit sub-header _here_, above the form
    const subHeader = formApi.getSubHeaderElement();
    if (subHeader) {
      subHeader.style.margin = "0 0 10px 0";
      bodyWrap.appendChild(subHeader);
    } else {
      console.warn(`Sub-header not found for modal '${id}'.`);
    }

    // 7) insert the form
    previewApi = shell.previewApi;
    formApi.form.classList.add("ui-scroll-float");
    bodyWrap.appendChild(formApi.form);

    // 8) live-preview wiring
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
