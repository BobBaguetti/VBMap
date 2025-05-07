// @file: scripts/modules/ui/modalFactory/index.js
// @version: 5

import { makeDraggable, positionModal, hideContextMenu } from "../uiManager.js";
import { createPickr } from "../pickrManager.js"; // match your controllers
import { createExtraInfoField } from "../forms/universalForm.js";

/**
 * Creates a fully generic definition modal.
 */
export function createDefinitionModal({
  id, title, schema, loadFn, saveFn, deleteFn,
  onInit, onPopulate, onCollect
}) {
  let modal, listEl, formEl;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = id;
    modal.className = "definition-modal";
    modal.style.display = "none";
    document.body.appendChild(modal);

    const hdr = document.createElement("h3");
    hdr.textContent = title;
    modal.appendChild(hdr);
    makeDraggable(modal, hdr);

    listEl = document.createElement("div");
    listEl.className = "def-list";
    modal.appendChild(listEl);

    formEl = document.createElement("form");
    formEl.className = "def-form";
    modal.appendChild(formEl);

    const footer = document.createElement("div");
    footer.className = "def-footer";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", onSave);
    footer.appendChild(saveBtn);

    if (deleteFn) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", onDelete);
      footer.appendChild(delBtn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", close);
    footer.appendChild(closeBtn);

    modal.appendChild(footer);

    document.addEventListener("click", e => {
      if (!modal.contains(e.target)) hideContextMenu();
    });

    onInit?.(modal);
    return modal;
  }

  let currentDefs = [], editing = {};

  async function open(event) {
    ensureModal();
    positionModal(modal, event || { pageX: innerWidth/2, pageY: innerHeight/2 });
    modal.style.display = "block";
    await refreshList();
  }

  async function refreshList() {
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
    formEl.innerHTML = "";
  }

  function populate(def) {
    editing = { ...def };
    clearForm();

    schema.forEach(field => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("field-row");
      if (field.type === "multiselect") wrapper.classList.add("loot-pool-row");

      const label = document.createElement("label");
      label.textContent = field.label;
      wrapper.appendChild(label);

      let input, extraInfoObj;

      // Extra-info widget
      if (field.extraInfo) {
        const { row, extraInfo } = createExtraInfoField({ withDividers: false });
        extraInfoObj = extraInfo;
        wrapper.appendChild(row);
        input = extraInfo.getInputElement();
      } else {
        switch (field.type) {
          case "textarea":
            input = document.createElement("textarea");
            input.value = editing[field.name] ?? "";
            break;
          case "multiselect":
            input = document.createElement("select");
            input.multiple = true;
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
            break;
          default:
            input = document.createElement("input");
            input.type = field.type;
            input.value = editing[field.name] ?? "";
        }
        wrapper.appendChild(input);
      }

      // Common attrs
      if (field.required) input.required = true;
      if (field.min != null) input.min = field.min;
      if (field.step != null) input.step = field.step;
      input.name = field.name;

      // Color picker via createPickr :contentReference[oaicite:1]{index=1}
      if (field.colorPicker) {
        const picker = createPickr(`#${input.id || (input.name)}`);
        input.addEventListener("click", () => picker.show());
        picker.on("change", () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
        picker.on("save",   () => formEl.dispatchEvent(new Event("input", { bubbles: true })));
      }

      // Loot-pool wrapper & cog
      if (field.type === "multiselect") {
        const select = input;
        const poolWrap = document.createElement("div");
        poolWrap.className = "loot-pool-wrapper";
        poolWrap.appendChild(select);
        const cog = document.createElement("button");
        cog.type = "button";
        cog.className = "loot-pool-cog";
        cog.innerHTML = "⚙";
        poolWrap.appendChild(cog);
        wrapper.appendChild(poolWrap);
      }

      formEl.appendChild(wrapper);

      if (field.extraInfo && extraInfoObj) {
        extraInfoObj.setLines(editing[field.name] || "");
      }
    });

    onPopulate?.(formEl, editing);
  }

  function collect() {
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

  function close() {
    modal.style.display = "none";
  }

  return { open, close };
}
