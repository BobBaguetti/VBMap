// @version: 18
// @file: /scripts/modules/ui/uiKit.js

import { createPickr } from "./pickrManager.js";

// ─── Modal Helpers ───────────────────────────────────────────────────────────

/**
 * Creates a modal window.
 *
 * @param {Object} options
 * @param {string}  options.id
 * @param {string}  options.title
 * @param {Function} options.onClose
 * @param {string}  [options.size]      – "small" or "large"
 * @param {boolean} [options.backdrop]
 * @param {boolean} [options.draggable]
 * @param {boolean} [options.withDivider]
 */
export function createModal({
  id, title, onClose,
  size = "small",
  backdrop = true,
  draggable = false,
  withDivider = false
}) {
  const modal = document.createElement("div");
  modal.classList.add("modal", `modal-${size}`);
  modal.id = id;
  if (!backdrop) modal.style.backgroundColor = "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.style.position = "absolute";
  content.style.transform = "none";

  if (size === "small") {
    content.style.width    = "350px";
    content.style.maxWidth = "350px";
  }

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}-handle`;
  header.style.cursor = "move";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    closeModal(modal);
    if (onClose) onClose();
  });

  header.append(titleEl, closeBtn);
  content.appendChild(header);

  if (withDivider) {
    content.appendChild(document.createElement("hr"));
  }

  modal.appendChild(content);
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  if (draggable) makeModalDraggable(content, header);
  document.body.appendChild(modal);
  return { modal, content, header };
}

function makeModalDraggable(modalEl, handle) {
  let offsetX = 0, offsetY = 0, dragging = false;
  handle.onmousedown = e => {
    dragging = true;
    offsetX = e.clientX - modalEl.offsetLeft;
    offsetY = e.clientY - modalEl.offsetTop;
    document.onmousemove = e2 => {
      if (!dragging) return;
      modalEl.style.left     = `${e2.clientX - offsetX}px`;
      modalEl.style.top      = `${e2.clientY - offsetY}px`;
      modalEl.style.position = 'absolute';
    };
    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}

export function closeModal(modal) {
  modal.style.display = "none";
}

export function openModalAt(modal, evt) {
  modal.style.display = "block";
  const content = modal.querySelector(".modal-content");
  const rect = content.getBoundingClientRect();
  content.style.left = `${evt.clientX - rect.width}px`;
  content.style.top  = `${evt.clientY - rect.height/2}px`;
}

// ─── Form & Field Builders ──────────────────────────────────────────────────

export function createFieldRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.classList.add("field-row");
  const label = document.createElement("label");
  label.textContent = labelText;
  row.append(label, inputEl);
  return row;
}

export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

export function createColorFieldRow(labelText, inputEl, colorId) {
  const row = document.createElement("div");
  row.classList.add("field-row");
  const label = document.createElement("label");
  label.textContent = labelText;
  const colorBtn = createColorButton(colorId);
  row.append(label, inputEl, colorBtn);
  return { row, colorBtn };
}

export function createDropdownField(label, id, options = [], { showColor = true } = {}) {
  const select = document.createElement("select");
  select.id = id;
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.append(o);
  });
  const { row, colorBtn } = createColorFieldRow(label, select, `${id}-color`);
  if (!showColor) colorBtn.style.visibility = "hidden";
  return { row, select, colorBtn };
}

export function createTextField(label, id) {
  const input = document.createElement("input");
  input.id = id;
  const { row, colorBtn } = createColorFieldRow(label, input, `${id}-color`);
  return { row, input, colorBtn };
}

export function createTextareaFieldWithColor(label, id) {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(label, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

export function createImageField(label, id) {
  const input = document.createElement("input");
  input.id = id; input.type = "text";
  return { row: createFieldRow(label, input), input };
}

export function createVideoField(label, id) {
  const input = document.createElement("input");
  input.id = id; input.type = "text";
  return { row: createFieldRow(label, input), input };
}

export function createFormButtonRow(onCancel, saveText = "Save", cancelText = "Cancel") {
  const row = document.createElement("div");
  row.className = "field-row";
  row.style.justifyContent = "center";
  row.style.marginTop = "10px";
  const btnSave = document.createElement("button");
  btnSave.type = "submit";  btnSave.className = "ui-button";  btnSave.textContent = saveText;
  const btnCancel = document.createElement("button");
  btnCancel.type = "button"; btnCancel.className = "ui-button"; btnCancel.textContent = cancelText;
  btnCancel.onclick = onCancel;
  row.append(btnSave, btnCancel);
  return row;
}

export function createExtraInfoBlock(options = {}) {
  const { defaultColor = "#E5E6E8", readonly = false } = options;
  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";
  const btnAdd = document.createElement("button");
  btnAdd.type = "button"; btnAdd.textContent = "+"; btnAdd.classList.add("ui-button");
  btnAdd.style.marginBottom = "8px";
  const lineWrap = document.createElement("div");
  wrap.append(btnAdd, lineWrap);
  let lines = [];
  function render() {
    lineWrap.innerHTML = "";
    lines.forEach((line, i) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";
      const input = document.createElement("input");
      input.className = "ui-input";
      input.value = line.text;
      input.readOnly = readonly;
      input.oninput = () => (lines[i].text = input.value);
      const color = document.createElement("div");
      color.className = "color-btn";
      color.id = `extra-color-${i}`;
      color.style.marginLeft = "5px";
      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "ui-button";
      btnRemove.textContent = "×";
      btnRemove.style.marginLeft = "5px";
      btnRemove.onclick = () => { lines.splice(i,1); render(); };
      row.append(input, color);
      if (!readonly) row.appendChild(btnRemove);
      lineWrap.appendChild(row);
      const pickr = createPickr(`#${color.id}`);
      pickr.setColor(line.color||defaultColor);
      line._pickr = pickr;
    });
  }
  btnAdd.onclick = () => { lines.push({ text:"", color: defaultColor }); render(); };
  function getLines() {
    return lines.map(l=>({
      text: l.text,
      color: l._pickr?.getColor()?.toHEXA()?.toString()||defaultColor
    }));
  }
  function setLines(newLines, isReadonly=false) {
    lines = newLines.map(l=>({ text:l.text||"", color:l.color||defaultColor }));
    render();
    if (isReadonly) btnAdd.style.display="none";
  }
  return { block: wrap, getLines, setLines };
}

// @version: 18
