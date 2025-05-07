// @file: scripts/modules/ui/modalFactory/index.js
// @version: 9

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createPickr }                        from "../pickrManager.js";
import { createExtraInfoField }               from "../forms/universalForm.js";

export function createDefinitionModal({
  id, title, schema,
  loadFn, saveFn, deleteFn,
  onInit, onPopulate, onCollect
}) {
  let modalEl, contentEl, headerEl;
  let listEl, formEl;
  let currentDefs = [], editing = {};

  function ensureModal() {
    if (modalEl) return { modalEl, contentEl, headerEl, listEl, formEl };

    const parts = createModal({
      id,
      title,
      size: "large",
      backdrop: true,
      draggable: true,
      withDivider: true,
      onClose: () => close()
    });
    modalEl   = parts.modal;
    contentEl = parts.content;
    headerEl  = parts.header;

    // Definitions list
    listEl = document.createElement("div");
    listEl.className = "def-list";
    contentEl.appendChild(listEl);

    // Form container
    formEl = document.createElement("form");
    formEl.className = "def-form";
    contentEl.appendChild(formEl);

    onInit?.(modalEl);
    return { modalEl, contentEl, headerEl, listEl, formEl };
  }

  async function open() {
    ensureModal();
    await refreshList();
    // Auto-open the “New” form
    populate({});
    openModal(modalEl);
  }

  function close() {
    if (modalEl) closeModal(modalEl);
  }

  async function refreshList() {
    ensureModal();
    currentDefs = await loadFn();
    listEl.innerHTML = "";

    currentDefs.forEach(def => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = def.name;
      btn.addEventListener("click", () => populate(def));
      listEl.appendChild(btn);
    });

    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.textContent = "+ New";
    newBtn.addEventListener("click", () => populate({}));
    listEl.appendChild(newBtn);
  }

  function clearForm() {
    ensureModal();
    formEl.innerHTML = "";
  }

  function populate(def) {
    ensureModal();
    editing = { ...def };
    clearForm();

    schema.forEach(field => {
      const row = document.createElement("div");
      row.className = "field-row";

      const label = document.createElement("label");
      label.textContent = field.label;
      row.appendChild(label);

      let input, extraInfoApi;

      if (field.extraInfo) {
        const { row: infoRow, extraInfo } = createExtraInfoField({ withDividers: false });
        extraInfoApi = extraInfo;
        row.appendChild(infoRow);
        input = infoRow.querySelector("input") || infoRow.querySelector("textarea");
      } else {
        switch (field.type) {
          case "textarea":
            input = document.createElement("textarea");
            input.value = editing[field.name] || "";
            row.appendChild(input);
            break;
          case "multiselect":
            input = document.createElement("select");
            input.multiple = true;
            row.appendChild(input);
            field.optionsService().then(opts => {
              opts.forEach(o => {
                const opt = document.createElement("option");
                opt.value = o.id;
                opt.textContent = o.name;
                if ((editing[field.name] || []).includes(o.id)) opt.selected = true;
                input.appendChild(opt);
              });
            });
            break;
          case "checkbox":
            input = document.createElement("input");
            input.type = "checkbox";
            input.checked = Boolean(editing[field.name]);
            row.appendChild(input);
            break;
          default:
            input = document.createElement("input");
            input.type = field.type;
            input.value = editing[field.name] || "";
            row.appendChild(input);
        }
      }

      input.name = field.name;
      if (field.required) input.required = true;
      if (field.min != null) input.min = field.min;
      if (field.step != null) input.step = field.step;

      if (field.colorPicker) {
        const pickr = createPickr(`#${input.id || input.name}`);
        pickr.on("change", () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
        pickr.on("save",   () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
      }

      formEl.appendChild(row);

      if (extraInfoApi) {
        extraInfoApi.setLines(editing[field.name] || [], false);
      }
    });

    onPopulate?.(formEl, editing);
  }

  function collect() {
    ensureModal();
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else if (el.multiple)        data[el.name] = Array.from(el.selectedOptions).map(o => o.value);
      else                         data[el.name] = el.value;
    });
    Object.assign(data, onCollect?.(formEl) || {});
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

  return { open, close };
}
