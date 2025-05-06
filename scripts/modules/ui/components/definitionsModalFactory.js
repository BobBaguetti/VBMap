// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 2.4 – search in header, sub-header between list & form, close button right

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
    unsubscribe = subscribeDefs(defs => {
      definitions = defs;
      listApi.refresh(definitions);
    });
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) Create the modal shell
    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: true,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap } = shell;

    // Make header flex so close button always far right
    header.style.display = "flex";
    header.style.alignItems = "center";

    // 1a) Render toolbar buttons (before layout toggles)
    toolbar.forEach(cfg => renderToolbarButton(cfg, header, { shell }));

    // 1b) Layout toggles are already appended by createDefinitionModalShell
    // but we want them after toolbar and before the search…

    // 1c) Inject search bar into header
    const { row: searchRow, input: searchInput } =
      createSearchRow(`${id}-search`, defaultSearchPlaceholder);
    searchRow.style.marginLeft = "auto";
    searchRow.style.flexShrink = "0";
    header.appendChild(searchRow);

    // 2) Instantiate form controller
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

    // 3) Build list container & divider
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

    // 4) Wire up definition list manager (it uses its own search input)
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      renderEntry,
      onEntryClick: def => {
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

    // Tie our header search to the list manager
    searchInput.addEventListener("input", () => {
      listApi.refresh(definitions);
    });

    // 5) Add/Edit sub-header (from the form controller)
    const subHeader = formApi.getSubHeaderElement();
    if (subHeader) {
      subHeader.style.margin = "0 0 10px";
      bodyWrap.appendChild(subHeader);
    } else {
      console.warn(`Sub-header not found in modal '${id}'`);
    }

    // 6) Insert the form
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
