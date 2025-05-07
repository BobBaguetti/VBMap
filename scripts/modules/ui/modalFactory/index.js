// @file: scripts/modules/ui/modalFactory/index.js
// @version: 6

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createPickr }                        from "../pickrManager.js";
import { createExtraInfoBlock }               from "../forms/universalForm.js";

/**
 * Creates a fully generic definition modal using your UI-kit’s createModal.
 */
export function createDefinitionModal({
  id, title, schema,
  loadFn, saveFn, deleteFn,
  onInit, onPopulate, onCollect
}) {
  let modalEl, contentEl, headerEl;
  let currentDefs = [], editing = {};

  function ensureModal() {
    if (modalEl) return { modalEl, contentEl, headerEl };

    // Use your UI-kit to build the backdrop, header, close button, sizing, etc.
    const modalParts = createModal({
      id,
      title,
      size: "large",
      backdrop: true,
      draggable: true,
      withDivider: true,
      onClose: () => close()
    });
    modalEl   = modalParts.modal;
    contentEl = modalParts.content;   // the .modal-content container
    headerEl  = modalParts.header;

    // Container for the list of definitions
    const listEl = document.createElement("div");
    listEl.className = "def-list";
    contentEl.appendChild(listEl);

    // Form element
    const formEl = document.createElement("form");
    formEl.className = "def-form";
    contentEl.appendChild(formEl);

    // Attach hooks
    onInit?.(modalEl);

    return { modalEl, contentEl, headerEl, listEl, formEl };
  }

  async function open(event) {
    const { modalEl } = ensureModal();
    await refreshList();
    openModal(modalEl);
  }

  function close() {
    if (modalEl) closeModal(modalEl);
  }

  async function refreshList() {
    const { listEl } = ensureModal();
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
    const { formEl } = ensureModal();
    formEl.innerHTML = "";
  }

  function populate(def) {
    const { formEl } = ensureModal();
    editing = { ...def };
    clearForm();

    schema.forEach(field => {
      // wrapper row
      const row = document.createElement("div");
      row.className = "field-row";

      const label = document.createElement("label");
      label.textContent = field.label;
      row.appendChild(label);

      let input, extraInfo;

      // extraInfo fields use your UI-kit block
      if (field.extraInfo) {
        const block = createExtraInfoBlock();
        extraInfo = block;
        row.appendChild(block.block);
        input = block.block.querySelector("input") || block.block.querySelector("textarea");
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

      // common attrs
      input.name = field.name;
      if (field.required) input.required = true;
      if (field.min != null) input.min = field.min;
      if (field.step != null) input.step = field.step;

      // colorPicker fields
      if (field.colorPicker) {
        const pickr = createPickr(`#${input.id || input.name}`);
        pickr.on("change", () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
        pickr.on("save",   () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
      }

      formEl.appendChild(row);

      // populate extraInfo lines
      if (extraInfo) {
        extraInfo.setLines(editing[field.name] || []);
      }
    });

    onPopulate?.(formEl, editing);
  }

  function collect() {
    const { formEl } = ensureModal();
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === "checkbox") {
        data[el.name] = el.checked;
      } else if (el.multiple) {
        data[el.name] = Array.from(el.selectedOptions).map(o => o.value);
      } else {
        data[el.name] = el.value;
      }
    });
    Object.assign(data, onCollect?.(formEl) || {});
    if (editing.id) data.id = editing.id;
    return data;
  }

  async function onSave() {
    const payload = collect();
    await saveFn(payload);
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
