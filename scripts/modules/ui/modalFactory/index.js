// @file: scripts/modules/ui/modalFactory/index.js
// @version: 11

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createPickr }               from "../pickrManager.js";
import { createExtraInfoField }       from "../forms/universalForm.js";

/**
 * Generic modal factory using your modal shell + schema-driven form.
 *
 * schema: array of { name, label, type, extraInfo?, colorPicker?, optionsService?, required?, min?, step? }
 * loadFn: () => Promise<[defs]>
 * saveFn: def => Promise
 * deleteFn: id => Promise
 * onCollect/onPopulate/onInit: hooks
 */
export function createDefinitionModal({
  id, title, schema,
  loadFn, saveFn, deleteFn,
  withPreview = false,
  previewType = null,
  layoutOptions = ["row","stacked","gallery"],
  onInit, onPopulate, onCollect
}) {
  // instantiate shell
  const shell = createDefinitionModalShell({
    id,
    title,
    size: "large",
    withPreview,
    previewType,
    layoutOptions,
    onClose: () => shell.close()
  });

  const { modal, bodyWrap, header } = shell;
  let listEl, formEl;
  let currentDefs = [], editing = {};
  const extraInfoMap = {};

  // build the two panels inside bodyWrap: left = list+search, right = form
  const leftPanel = document.createElement("div");
  leftPanel.className = "def-shell-list";
  Object.assign(leftPanel.style, { flex: "0 0 200px", overflowY: "auto" });

  // search input
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search…";
  search.className = "ui-input";
  search.style.width = "100%";
  search.style.marginBottom = "8px";
  leftPanel.appendChild(search);

  // list container
  listEl = document.createElement("div");
  leftPanel.appendChild(listEl);

  // toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "def-shell-toolbar";
  toolbar.style.marginTop = "8px";
  const newBtn = document.createElement("button");
  newBtn.textContent = "+ New";
  newBtn.className = "ui-button";
  toolbar.appendChild(newBtn);
  leftPanel.appendChild(toolbar);

  // form panel
  formEl = document.createElement("div");
  formEl.className = "def-shell-form";
  formEl.style.flex = "1 1 auto";
  formEl.style.overflowY = "auto";
  formEl = document.createElement("form");
  formEl.className = "def-form";

  // layout panels
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.height = "100%";
  container.append(leftPanel, formEl);
  bodyWrap.appendChild(container);

  // Hook up search & new
  search.addEventListener("input", filterList);
  newBtn.addEventListener("click", () => populate({}));

  // load definitions, render list
  async function refreshList() {
    currentDefs = await loadFn();
    renderList();
  }

  function renderList() {
    listEl.innerHTML = "";
    const q = (search.value || "").toLowerCase();
    currentDefs
      .filter(d => d.name.toLowerCase().includes(q))
      .forEach(def => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = def.name;
        btn.className = "ui-button def-list-entry";
        btn.onclick = () => populate(def);
        listEl.appendChild(btn);
      });
  }

  function filterList() {
    renderList();
  }

  function clearForm() {
    formEl.innerHTML = "";
    Object.keys(extraInfoMap).forEach(k => delete extraInfoMap[k]);
  }

  function populate(def) {
    editing = { ...def };
    clearForm();

    schema.forEach(field => {
      const row = document.createElement("div");
      row.className = "field-row";
      // label
      const label = document.createElement("label");
      label.textContent = field.label;
      row.appendChild(label);

      let input, extraInfoApi;

      if (field.extraInfo) {
        const { row: infoRow, extraInfo } = createExtraInfoField({ withDividers: false });
        extraInfoMap[field.name] = extraInfo;
        row.appendChild(infoRow);
      } else {
        switch (field.type) {
          case "textarea":
            input = document.createElement("textarea");
            input.value = editing[field.name] || "";
            break;
          case "checkbox":
            input = document.createElement("input");
            input.type = "checkbox";
            input.checked = Boolean(editing[field.name]);
            break;
          case "multiselect":
            input = document.createElement("select");
            input.multiple = true;
            field.optionsService().then(opts => {
              opts.forEach(o => {
                const oEl = document.createElement("option");
                oEl.value = o.id;
                oEl.textContent = o.name;
                if ((editing[field.name]||[]).includes(o.id)) oEl.selected = true;
                input.appendChild(oEl);
              });
            });
            break;
          default:
            input = document.createElement("input");
            input.type = field.type;
            input.value = editing[field.name] || "";
        }
        row.appendChild(input);
      }

      // common
      if (input) {
        input.name = field.name;
        if (field.required) input.required = true;
        if (field.min!=null) input.min = field.min;
        if (field.step!=null) input.step = field.step;
        if (field.colorPicker) {
          const pickr = createPickr(`#${input.id||input.name}`);
          pickr.on("change", ()=> formEl.dispatchEvent(new Event("input",{bubbles:true})));
          pickr.on("save",   ()=> formEl.dispatchEvent(new Event("input",{bubbles:true})));
        }
      }

      formEl.appendChild(row);

      // populate extra info
      if (field.extraInfo && extraInfoMap[field.name]) {
        extraInfoMap[field.name].setLines(editing[field.name]||[], false);
      }
    });
  }

  function collect() {
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === "checkbox") data[el.name]=el.checked;
      else if (el.multiple)        data[el.name]=Array.from(el.selectedOptions).map(o=>o.value);
      else                         data[el.name]=el.value;
    });
    Object.entries(extraInfoMap).forEach(([k,api])=> {
      data[k] = api.getLines();
    });
    Object.assign(data, onCollect?.(formEl)||{});
    if (editing.id) data.id = editing.id;
    return data;
  }

  async function onSave() {
    await saveFn(collect());
    await refreshList();
  }
  async function onDelete() {
    if (!editing.id) return;
    await deleteFn(editing.id);
    await refreshList();
    clearForm();
  }

  // add save/delete buttons below form
  const btnRow = document.createElement("div");
  btnRow.className = "field-row";
  btnRow.style.justifyContent="flex-end";
  const saveBtn = document.createElement("button");
  saveBtn.type="button"; saveBtn.textContent="Save"; saveBtn.onclick=onSave;
  btnRow.appendChild(saveBtn);
  if (deleteFn) {
    const delBtn = document.createElement("button");
    delBtn.type="button"; delBtn.textContent="Delete"; delBtn.onclick=onDelete;
    btnRow.append(delBtn);
  }
  formEl.appendChild(btnRow);

  // initial load
  refreshList();

  onInit?.(modal);

  return {
    open: shell.open,
    close: shell.close
  };
}
