// @version: 1
// @file: /scripts/modules/ui/modals/questDefinitionsModal.js

import { createModal, closeModal } from "../uiKit.js";
import {
    createFilterButtonGroup,
    createSearchRow,
    createDefListContainer,
    createFilterableList
  } from "../../utils/listUtils.js";
import {
  loadQuestDefinitions,
  saveQuestDefinition,
  deleteQuestDefinition,
  subscribeQuestDefinitions
} from "../../services/questDefinitionsService.js";
import {
  createTextField,
  createTextareaFieldWithColor,
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";

export function initQuestDefinitionsModal(db) {
  // 1) Modal
  const { modal, content } = createModal({
    id: "quest-definitions-modal",
    title: "Manage Quests",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  // 2) List container
  const listContainer = createDefListContainer("quest-definitions-list");
  content.appendChild(listContainer);

  // 3) Sort/filter/search + entry renderer
  const sortFns = {
    "filter-title":       (a,b) => a.title.localeCompare(b.title),
    "filter-description": (a,b) => a.description.localeCompare(b.description),
    "filter-objectives":  (a,b) => (b.objectives?.length||0) - (a.objectives?.length||0),
    "filter-value":       (a,b) => (parseFloat(b.rewardValue)||0) - (parseFloat(a.rewardValue)||0),
    "filter-quantity":    (a,b) => (parseInt(b.rewardQuantity)||0) - (parseInt(a.rewardQuantity)||0)
  };
  const filters = [
    { id: "filter-title",       label: "T"  },
    { id: "filter-description", label: "D"  },
    { id: "filter-objectives",  label: "O"  },
    { id: "filter-value",       label: "P"  },
    { id: "filter-quantity",    label: "Qt" }
  ];
  const { refresh, open } = createFilterableList(
    listContainer,
    [],           // data loaded below
    sortFns,
    def => {
      const div = document.createElement("div");
      div.className = "item-def-entry";
      div.innerHTML = `
        <strong>${def.title}</strong><br/>
        Reward: ${def.rewardValue||"—"} • Qty: ${def.rewardQuantity||"—"}
      `;
      div.onclick = () => populateForm(def);
      return div;
    },
    {
      filters,
      searchPlaceholder: "Search quests…"
    }
  );
  content.appendChild(document.createElement("hr"));

  // 4) Form
  const form = document.createElement("form"); form.id = "quest-definition-form";
  const subheading = document.createElement("h3");
  subheading.textContent = "Add / Edit Quest";
  form.append(subheading);

  const { row: rowTitle, input: fldTitle } =
    createTextField("Title:", "def-title");
  form.append(rowTitle);

  const { row: rowDesc, textarea: fldDesc } =
    createTextareaFieldWithColor("Description:", "def-desc");
  form.append(rowDesc);

  const { block: objBlock, getLines: getObjs, setLines: setObjs } =
    createExtraInfoBlock();
  const rowObjs = document.createElement("div");
  rowObjs.className = "field-row extra-row";
  const lblObjs = document.createElement("label");
  lblObjs.textContent = "Objectives:";
  rowObjs.append(lblObjs, objBlock);
  form.append(rowObjs);

  const { row: rowVal, input: fldVal } =
    createTextField("Reward Value:", "def-reward-value");
  form.append(rowVal);

  const { row: rowQty, input: fldQty } =
    createTextField("Reward Quantity:", "def-reward-quantity");
  form.append(rowQty);

  const btnRow = createFormButtonRow(() => closeModal(modal));
  form.append(btnRow);
  content.appendChild(form);

  // 5) State
  let defs = [], editingId = null;

  async function loadAndRefresh() {
    defs = await loadQuestDefinitions(db);
    refresh(defs);
  }

  function clearForm() {
    editingId = null;
    fldTitle.value = fldDesc.value = fldVal.value = fldQty.value = "";
    setObjs([], false);
    subheading.textContent = "Add / Edit Quest";
  }

  function populateForm(def) {
    editingId = def.id;
    fldTitle.value = def.title;
    fldDesc.value = def.description;
    setObjs(def.objectives || [], false);
    fldVal.value = def.rewardValue || "";
    fldQty.value = def.rewardQuantity || "";
    subheading.textContent = "Edit Quest";
    open();
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      title:            fldTitle.value.trim(),
      description:      fldDesc.value.trim(),
      objectives:       getObjs(),
      rewardValue:      fldVal.value.trim(),
      rewardQuantity:   fldQty.value.trim()
    };
    await saveQuestDefinition(db, editingId, payload);
    closeModal(modal);
    await loadAndRefresh();
  });

  // Delete
  const delBtn = document.createElement("button");
  delBtn.type = "button"; delBtn.className = "ui-button"; delBtn.textContent = "Delete";
  delBtn.onclick = async () => {
    if (!editingId) return;
    await deleteQuestDefinition(db, editingId);
    closeModal(modal);
    await loadAndRefresh();
  };
  btnRow.appendChild(delBtn);

  // Real‑time
  subscribeQuestDefinitions(db, datas => {
    defs = datas;
    refresh(defs);
  });

  // 6) API
  return {
    open: async () => { clearForm(); await loadAndRefresh(); open(); },
    refresh: loadAndRefresh
  };
}
