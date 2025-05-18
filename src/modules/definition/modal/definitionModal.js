// @file: src/modules/definition/modals/definitionModal.js
// @version: 1.22 — fully self-contained modal (inlined factory + lifecycle)

import { definitionTypes }        from "../types.js";
import { createDefListContainer }  from "../../../shared/utils/listUtils.js";
import { createFormControllerHeader, wireFormEvents }
  from "../../../shared/ui/forms/formControllerShell.js";
import { initFormPickrs }         from "../../../shared/ui/forms/pickrAdapter.js";
import { createFormState }        from "../../../shared/ui/forms/formStateManager.js";
import { loadItemDefinitions }
  from "../../services/itemDefinitionsService.js";

export function initDefinitionModal(db) {
  let modal, content, header, listSlot, previewSlot;
  let fldType, listApi, formApi, previewApi;
  let formContainer, previewContainer, searchInput;
  let definitions = [], currentType;
  let itemMap = {};

  // Lifecycle & ESC handler
  function attachLifecycle(modalEl) {
    // Prevent background scroll & restore focus on close
    const prevFocused = document.activeElement;
    const scrollY     = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    modalEl.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollY);
      prevFocused?.focus?.();
    }, { once: true });
  }
  function onKey(e) {
    if (e.key === "Escape" && modal) {
      closeModal(modal);
    }
  }

  // Open / close
  function openModal(el) {
    el.classList.add("is-open");
    document.addEventListener("keydown", onKey);
  }
  function closeModal(el) {
    el.classList.remove("is-open");
    el.dispatchEvent(new Event("close"));
    document.removeEventListener("keydown", onKey);
  }

  async function refreshList() {
    definitions = await definitionTypes[currentType].loadDefs(db);
    listApi.refresh(definitions);
  }

  function build() {
    if (modal) return;

    // 1) Root modal container
    modal = document.createElement("div");
    modal.id = "definition-modal";
    modal.className = "modal--definition";
    // hidden by default in CSS
    document.body.append(modal);

    // Attach lifecycle (focus restore)
    attachLifecycle(modal);

    // 2) Content wrapper
    content = document.createElement("div");
    content.className = "modal-content";
    modal.append(content);

    // 3) Header
    header = document.createElement("div");
    header.className = "modal-header";
    const titleEl = document.createElement("h2");
    titleEl.textContent = "Manage Definitions";
    const closeBtn = document.createElement("span");
    closeBtn.className = "close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => closeModal(modal);
    header.append(titleEl, closeBtn);
    content.append(header);

    // 4) Slots: left & preview
    listSlot = document.createElement("div");
    listSlot.id = "definition-left-pane";
    previewSlot = document.createElement("div");
    previewSlot.id = "definition-preview-container";
    content.append(listSlot, previewSlot);

    // 5) Search & type in header
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "modal__search";
    searchInput.placeholder = "Search definitions…";
    header.insertBefore(searchInput, closeBtn);

    const typeWrapper = document.createElement("div");
    typeWrapper.className = "modal__type-selector";
    const typeLabel = document.createElement("span");
    typeLabel.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.id = "definition-type";
    typeWrapper.append(typeLabel, fldType);
    header.insertBefore(typeWrapper, closeBtn);

    // 6) List container
    const listContainer = createDefListContainer("definition-list");
    listSlot.append(listContainer);

    // 7) Placeholder and form container
    const subheaderEl = document.createElement("div");
    subheaderEl.className = "modal-subheader";
    listSlot.append(subheaderEl);
    formContainer = document.createElement("div");
    formContainer.id = "definition-form-container";
    listSlot.append(formContainer);

    // 8) List manager
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      onEntryClick:   def => openDefinition(currentType, def),
      onDelete:       async id => {
        await definitionTypes[currentType].del(db, id);
        await refreshList();
      }
    });
    searchInput.addEventListener("input", () =>
      listApi.filter(searchInput.value)
    );
  }

  async function openDefinition(type, def = null) {
    build();
    currentType   = type;
    // Populate type dropdown
    fldType.innerHTML = Object.keys(definitionTypes)
      .map(t => `<option value="${t}">${t}</option>`).join("");
    fldType.value = type;
    await refreshList();

    // Load items for Chest preview
    if (type === "Chest") {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    // Setup preview pane
    previewApi = definitionTypes[type].previewBuilder(previewSlot);

    // Build form
    formContainer.innerHTML = "";
    formApi = definitionTypes[type].controller({
      title:     type,
      hasFilter: true,
      onCancel:  () => { formApi.reset(); previewApi.hide(); },
      onDelete:  async id => {
        await definitionTypes[type].del(db, id);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onSubmit:  async payload => {
        await definitionTypes[type].save(db, payload.id ?? null, payload);
        await refreshList();
        formApi.reset(); previewApi.hide();
      },
      onFieldChange: data => {
        let pd = data;
        if (type === "Chest" && Array.isArray(data.lootPool)) {
          pd = { ...data, lootPool: data.lootPool.map(id=>itemMap[id]).filter(Boolean) };
        }
        previewApi.show(pd);
      }
    }, db);

    // Slot subheader
    const generatedHeader = formApi.form.querySelector(".modal-subheader");
    subheaderEl.replaceWith(generatedHeader);

    formContainer.append(formApi.form);
    formApi.initPickrs?.();

    if (def) {
      formApi.populate(def);
      previewApi.show(type === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean) }
        : def
      );
    } else {
      formApi.reset();
      previewApi.show(type === "Chest" ? { lootPool: [] } : {});
    }

    openModal(modal);
  }

  return {
    openCreate: (evt, type="Item") => openDefinition(type),
    openEdit:   def               => openDefinition(currentType, def)
  };
}
