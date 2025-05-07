// @file: scripts/modules/ui/modalFactory/index.js
// @version: 12

import { createDefinitionModalShell }    from "../components/definitionModalShell.js";
import { createDefinitionListManager }   from "../../utils/definitionListManager.js";
import { createPickr }                   from "../pickrManager.js";
import { createExtraInfoField }          from "../forms/universalForm.js";

/**
 * Fully-generic, 1:1 recreation of your old definition modals.
 */
export function createDefinitionModal({
  id, title, schema,
  loadFn, saveFn, deleteFn,
  previewType = null,
  layoutOptions = ["row","stacked","gallery"],
  onInit, onPopulate, onCollect
}) {
  // 1) Shell
  const shell = createDefinitionModalShell({
    id, title,
    size: "large",
    layoutOptions,
    onClose: () => shell.close()
  });
  const { bodyWrap } = shell;

  // 2) Left + Right panels
  const leftPanel = document.createElement("div");
  leftPanel.style.flex = "0 0 220px";
  leftPanel.style.display = "flex";
  leftPanel.style.flexDirection = "column";
  leftPanel.style.marginRight = "12px";

  const listContainer = document.createElement("div");
  leftPanel.appendChild(listContainer);

  const rightPanel = document.createElement("div");
  rightPanel.style.flex = "1 1 auto";
  rightPanel.style.overflowY = "auto";

  bodyWrap.innerHTML = "";  
  bodyWrap.style.display = "flex";
  bodyWrap.append(leftPanel, rightPanel);

  // 3) Definition List Manager (restores search + layout + entries UI)
  const listManager = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    onEntryClick: populate,
    onDelete: async id => {
      await deleteFn(id);
      await refreshList();
    },
    getCurrentLayout: () => listManagerLayout
  });

  let listManagerLayout = layoutOptions[0];

  // Watch layout switcher in shell header
  shell.layoutSwitcher.onChange = newLayout => {
    listManagerLayout = newLayout;
    listManager.setLayout(newLayout);
  };

  // 4) Form
  const formEl = document.createElement("form");
  formEl.className = "def-form";
  rightPanel.appendChild(formEl);

  // Save/Delete buttons
  const btnRow = document.createElement("div");
  btnRow.className = "field-row";
  btnRow.style.justifyContent = "flex-end";
  const saveBtn = document.createElement("button");
  saveBtn.type = "button"; saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", onSave);
  btnRow.appendChild(saveBtn);
  if (deleteFn) {
    const delBtn = document.createElement("button");
    delBtn.type = "button"; delBtn.textContent = "Delete";
    delBtn.addEventListener("click", onDelete);
    btnRow.appendChild(delBtn);
  }
  formEl.appendChild(btnRow);

  // 5) State
  let definitions = [];
  let editing = {};
  const extraInfoMap = {};

  // 6) Core routines
  async function refreshList() {
    definitions = await loadFn();
    listManager.refresh();
  }

  function clearForm() {
    formEl.querySelectorAll(".field-row:not(:last-child)").forEach(r => r.remove());
    Object.keys(extraInfoMap).forEach(k => delete extraInfoMap[k]);
  }

  function populate(def) {
    editing = { ...def };
    clearForm();

    schema.forEach(field => {
      const row = document.createElement("div");
      row.className = "field-row";

      const label = document.createElement("label");
      label.textContent = field.label;
      row.appendChild(label);

      let input, extraApi;
      if (field.extraInfo) {
        const { row: infoRow, extraInfo } = createExtraInfoField({ withDividers: false });
        extraApi = extraInfo;
        extraInfoMap[field.name] = extraApi;
        row.appendChild(infoRow);
      } else {
        input = document.createElement(field.type === "textarea" ? "textarea" : "input");
        if (field.type !== "textarea") input.type = field.type;
        if (field.type === "checkbox") input.checked = Boolean(editing[field.name]);
        else input.value = editing[field.name] || "";
        input.name = field.name;
        row.appendChild(input);

        if (field.colorPicker) {
          const pickr = createPickr(`#${input.id||input.name}`);
          pickr.on("change", () => formEl.dispatchEvent(new Event("input",{bubbles:true})));
          pickr.on("save",   () => formEl.dispatchEvent(new Event("input",{bubbles:true})));
        }
      }

      formEl.insertBefore(row, btnRow);
      if (extraApi) extraApi.setLines(editing[field.name]||[], false);
    });

    onPopulate?.(formEl, editing);
  }

  function collect() {
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    Object.entries(extraInfoMap).forEach(([k,api]) => {
      data[k] = api.getLines();
    });
    Object.assign(data, onCollect?.(formEl)||{});
    if (editing.id) data.id = editing.id;
    return data;
  }

  async function onSave() {
    await saveFn(collect());
    await refreshList();
    listManager.refresh();
  }

  async function onDelete() {
    if (!editing.id) return;
    await deleteFn(editing.id);
    await refreshList();
    clearForm();
  }

  // Public API
  return {
    open: async () => {
      await refreshList();
      listManager.refresh();
      populate({});    // default to new
      shell.open();
    },
    close: () => shell.close()
  };
}
