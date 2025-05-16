// @file: src/modules/ui/modals/definitionModal.js
// @version: 1.2 — use openModal instead of missing openShell

import { createModal, openModal, closeModal }    from "../components/uiKit/modalKit.js";
import { definitionTypes }                       from "../../definition/types.js";
import { createDefListContainer }                 from "../../utils/listUtils.js";
import { createPreviewController }                from "../preview/previewController.js";
import { createDefinitionListManager }            from "../components/definitionListManager.js";

export function initDefinitionModal(db) {
  let modal, content;
  let fldType, listApi, formApi, previewApi, formContainer;
  let definitions = [], currentType, currentId;

  async function refreshList() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  async function build() {
    if (modal) return;
    // 1) Create modal shell
    ({ modal, content } = createModal({
      id:         "definition-modal",
      title:      "Manage Definitions",
      size:       "large",
      searchable: true,
      onClose:    () => previewApi.hide()
    }));
    modal.classList.add("admin-only");

    // 2) Type selector
    const labType = document.createElement("label");
    labType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      ${Object.keys(definitionTypes)
        .map(t => `<option value="${t}">${t}</option>`)
        .join("")}
    `;
    labType.appendChild(fldType);

    // 3) List + Form + Preview containers
    const listContainer = createDefListContainer("def-list");
    formContainer = document.createElement("div");
    formContainer.id = "def-form-container";
    previewApi = createPreviewController("item");

    content.append(labType, listContainer, formContainer);

    // 4) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openEdit(def),
      onDelete:       async id => {
        await definitionTypes[currentType].del(db, id);
        await refreshList();
      }
    });

    // 5) Search wiring
    const searchInput = modal.querySelector(".modal__search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        listApi.filter(searchInput.value);
      });
    }
  }

  return {
    /**
     * Open the modal to create a new definition of the given type.
     * @param {MouseEvent} evt
     * @param {string}     type
     */
    async openCreate(evt, type) {
      await build();
      // Set up type and list
      currentType    = type || Object.keys(definitionTypes)[0];
      fldType.value  = currentType;
      await refreshList();

      // Build form controller
      const cfg = definitionTypes[currentType];
      formContainer.innerHTML = "";
      formApi = cfg.controller({
        onCancel:   () => { formApi.reset(); previewApi.hide(); },
        onDelete:   async id   => {
          await cfg.del(db, id);
          await refreshList();
          formApi.reset();
          previewApi.hide();
        },
        onSubmit:   async payload => {
          if (payload.id) {
            await cfg.save(db, payload.id, payload);
          } else {
            await cfg.save(db, null, payload);
          }
          await refreshList();
          formApi.reset();
          previewApi.hide();
        },
        onFieldChange: data => previewApi.show(data)
      }, db);
      formContainer.appendChild(formApi.form);

      // Initialize state
      currentId = null;
      formApi.reset();
      previewApi.hide();

      // Show modal
      openModal(modal);
    },

    /**
     * Open the modal to edit an existing definition.
     * @param {Object} def – existing definition object
     */
    async openEdit(def) {
      await build();
      currentType   = def.type;
      fldType.value = currentType;
      await refreshList();

      // Build form controller
      const cfg = definitionTypes[currentType];
      formContainer.innerHTML = "";
      formApi = cfg.controller({
        onCancel:   () => { formApi.reset(); previewApi.hide(); },
        onDelete:   async id   => {
          await cfg.del(db, id);
          await refreshList();
          formApi.reset(); previewApi.hide();
        },
        onSubmit:   async payload => {
          payload.id = def.id;
          await cfg.save(db, payload.id, payload);
          await refreshList();
          formApi.reset(); previewApi.hide();
        },
        onFieldChange: data => previewApi.show(data)
      }, db);
      formContainer.appendChild(formApi.form);

      // Populate and show
      currentId = def.id;
      formApi.populate(def);
      previewApi.show(def);

      openModal(modal);
    }
  };
}
