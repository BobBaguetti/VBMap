import { createModal, closeModal } from "../uiKit.js";
import { createFilterableList } from "../../utils/listUtils.js";
import { buildItemDefinitionForm } from "../forms/itemDefinitionForm.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

export function initItemDefinitionsModal(db) {
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  const listContainer = document.createElement("div");
  listContainer.id = "item-definitions-list";
  content.appendChild(listContainer);

  const sortFns = {
    "filter-name":        (a,b) => a.name.localeCompare(b.name),
    "filter-type":        (a,b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a,b) => (b.rarity||"").localeCompare(a.rarity||""),
    "filter-description": (a,b) => (a.description||"").localeCompare(b.description||""),
    "filter-quantity":    (a,b) => (parseInt(b.quantity)||0) - (parseInt(a.quantity)||0),
    "filter-price":       (a,b) => (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
  };
  const filters = [
    { id: "filter-name", label: "N" },
    { id: "filter-type", label: "T" },
    { id: "filter-rarity", label: "R" },
    { id: "filter-description", label: "D" },
    { id: "filter-quantity", label: "Qt" },
    { id: "filter-price", label: "P" }
  ];

  const { refresh, open } = createFilterableList(
    listContainer,
    [],
    sortFns,
    def => {
      const div = document.createElement("div");
      div.className = "item-def-entry";
      div.innerHTML = `
        <strong>${def.name}</strong> (${def.rarity})<br/>
        Type: ${def.itemType} • Qty: ${def.quantity||"—"} • Value: ${def.value||"—"}
      `;
      div.onclick = () => {
        formBuilder.populate(def);
        open();
      };
      return div;
    },
    {
      filters,
      searchPlaceholder: "Search items…"
    }
  );

  content.appendChild(document.createElement("hr"));

  // Build Form
  const formBuilder = buildItemDefinitionForm({
    onCancel: () => closeModal(modal),
    onSubmit: async def => {
      if (def.id) {
        await updateItemDefinition(db, def);
      } else {
        await saveItemDefinition(db, null, def);
      }
      closeModal(modal);
      await loadAndRefresh();
    }
  });
  content.appendChild(formBuilder.form);

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "Delete";
  delBtn.className = "ui-button";
  delBtn.onclick = async () => {
    const id = formBuilder?.form.querySelector("#def-form-subheading")?.textContent.includes("Edit")
      ? formBuilder?.form.id
      : null;
    if (!id) return;
    await deleteItemDefinition(db, id);
    closeModal(modal);
    await loadAndRefresh();
  };
  formBuilder.form.querySelector(".field-row:last-child")?.appendChild(delBtn);

  async function loadAndRefresh() {
    const defs = await loadItemDefinitions(db);
    refresh(defs);
  }

  subscribeItemDefinitions(db, defs => refresh(defs));

  return {
    open: async () => {
      formBuilder.reset();
      await loadAndRefresh();
      modal.style.display = "block";
    },
    refresh: loadAndRefresh
  };
}
