// @file: src/modules/ui/modals/definitionModal.js
// @version: 1.0 — unified modal for definition types (Item only for now)

import { createModal, openModalAt, closeModal } from "../components/uiKit/modalKit.js";
import { definitionTypes }                    from "../../definition/types.js";
import { createDefListContainer }              from "../../utils/listUtils.js";
import { createPreviewController }             from "../preview/previewController.js";
import { createDefinitionListManager }          from "../components/definitionListManager.js";

export function initDefinitionModal(db) {
  let modal, content, openShell;
  let fldType, listApi, formApi, previewApi;
  let definitions = [], currentType, currentId;

  async function build() {
    if (modal) return;
    // 1) Shell
    ({ modal, content, open: openShell } = createModal({
      id:        "definition-modal",
      title:     "Manage Definitions",
      size:      "large",
      searchable:true,
      onClose:   () => previewApi.hide()
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
    const formContainer = document.createElement("div");
    formContainer.id = "def-form-container";
    previewApi = createPreviewController("item");  // item for now

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

    // 5) Type switch handler
    fldType.addEventListener("change", async () => {
      currentType = fldType.value;
      await refreshList();

      // Build form controller
      const cfg = definitionTypes[currentType];
      formContainer.innerHTML = "";
      formApi = cfg.controller({
        onCancel: () => {
          formApi.reset();
          previewApi.hide();
        },
        onDelete: async id => {
          await cfg.del(db, id);
          await refreshList();
          formApi.reset();
          previewApi.hide();
        },
        onSubmit: async payload => {
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
    });

    // 6) Search wiring
    const searchInput = modal.querySelector(".modal__search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        listApi.filter(searchInput.value);
      });
    }
  }

  async function refreshList() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  async function openCreate(evt, type) {
    await build();
    fldType.value = type || "Item";
    fldType.dispatchEvent(new Event("change"));
    currentId = null;
    formApi.reset();
    openModalAt(modal, evt);
  }

  async function openEdit(def) {
    await build();
    fldType.value = def.type || "Item";
    fldType.dispatchEvent(new Event("change"));
    currentId = def.id;
    formApi.populate(def);
    openModalAt(modal, event);
  }

  return { openCreate, openEdit };
}
