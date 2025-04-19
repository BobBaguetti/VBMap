// @version: 12
// @file: /scripts/modules/ui/uiKit.js

import { createPickr } from "./pickrManager.js";

// ------------------------------
// Basic Modal and Layout Helpers
// ------------------------------

/**
 * Creates a modal window with a centered layout, header title, and close button.
 * Also attaches outside‑click handler to close modal.
 * Accepts an optional `size` argument: "small" (default) or "large".
 */
export function createModal({ id, title, onClose, size = "small" }) {
  const modal = document.createElement('div');
  modal.classList.add('modal', `modal-${size}`);
  modal.id = id;
  // Disable the dark backdrop entirely
  modal.style.backgroundColor = 'transparent';

  const content = document.createElement('div');
  content.classList.add('modal-content');
  // Ensure we can set numeric top/left
  content.style.position = 'absolute';
  content.style.transform = 'none';

  // Header / handle
  const header = document.createElement('div');
  header.classList.add('modal-header');
  header.id = `${id}-handle`;
  header.style.cursor = 'move';

  const titleEl = document.createElement('h2');
  titleEl.textContent = title;

  const closeBtn = document.createElement('span');
  closeBtn.classList.add('close');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    closeModal(modal);
    if (onClose) onClose();
  });

  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  content.appendChild(header);
  modal.appendChild(content);

  // Clicking outside the content closes it
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  // Only drag the window, not the backdrop
  makeModalDraggable(content, header);

  document.body.appendChild(modal);
  return { modal, content, header };
}

/**
 * Enables dragging of the given element via the provided handle.
 */
function makeModalDraggable(modalEl, handle) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  handle.onmousedown = e => {
    isDragging = true;
    offsetX = e.clientX - modalEl.offsetLeft;
    offsetY = e.clientY - modalEl.offsetTop;
    document.onmousemove = e => {
      if (isDragging) {
        modalEl.style.left = `${e.clientX - offsetX}px`;
        modalEl.style.top  = `${e.clientY - offsetY}px`;
        modalEl.style.position = 'absolute';
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup   = null;
    };
  };
}

/** Hides the given modal element. */
export function closeModal(modal) {
  modal.style.display = 'none';
}

/**
 * Shows and centers the given modal element in the viewport.
 */
export function openModal(modal) {
  const content = modal.querySelector('.modal-content');
  content.style.transform = 'none';
  content.style.position  = 'absolute';
  const rect = content.getBoundingClientRect();
  content.style.left = `${window.innerWidth/2 - rect.width/2}px`;
  content.style.top  = `${window.innerHeight/2 - rect.height/2}px`;
  modal.style.display = 'block';
}

/**
 * Creates a standard field row with a label and an input-like element.
 */
export function createFieldRow(labelText, inputEl) {
  const row = document.createElement('div');
  row.classList.add('field-row');
  const label = document.createElement('label');
  label.textContent = labelText;
  row.appendChild(label);
  row.appendChild(inputEl);
  return row;
}

/** Returns a stub div used as a color picker button. */
export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

/**
 * Combines a label, input element, and color picker into a single row.
 */
export function createColorFieldRow(labelText, inputEl, colorId) {
  const row = document.createElement("div");
  row.classList.add("field-row");
  const label = document.createElement("label");
  label.textContent = labelText;
  const colorBtn = createColorButton(colorId);
  row.appendChild(label);
  row.appendChild(inputEl);
  row.appendChild(colorBtn);
  return { row, colorBtn };
}

// ------------------------------
// Modular Extra Info Line Builder
// ------------------------------
export function createExtraInfoBlock(options = {}) {
  const { defaultColor = "#E5E6E8", readonly = false } = options;
  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";
  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");
  btnAdd.style.marginBottom = "8px";
  const lineWrap = document.createElement("div");
  wrap.appendChild(btnAdd);
  wrap.appendChild(lineWrap);
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
      input.oninput = () => { lines[i].text = input.value; };
      const color = document.createElement("div");
      color.className = "color-btn";
      color.id = `extra-color-${i}`;
      color.style.marginLeft = "5px";
      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "ui-button";
      btnRemove.textContent = "×";
      btnRemove.style.marginLeft = "5px";
      btnRemove.onclick = () => { lines.splice(i, 1); render(); };
      row.append(input, color);
      if (!readonly) row.appendChild(btnRemove);
      lineWrap.appendChild(row);
      const pickr = createPickr(`#${color.id}`);
      pickr.setColor(line.color || defaultColor);
      line._pickr = pickr;
    });
  }

  btnAdd.onclick = () => {
    lines.push({ text: "", color: defaultColor });
    render();
  };

  function getLines() {
    return lines.map(l => ({
      text: l.text,
      color: l._pickr?.getColor()?.toHEXA()?.toString() || defaultColor
    }));
  }

  function setLines(newLines, isReadonly = false) {
    lines = newLines.map(l => ({ text: l.text || "", color: l.color || defaultColor }));
    render();
    if (isReadonly) btnAdd.style.display = "none";
  }

  return { block: wrap, getLines, setLines };
}

/** Creates a labeled text input row with a color picker. */
export function createTextField(labelText, id, defaultColor = "#E5E6E8") {
  const input = document.createElement("input");
  input.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, input, `${id}-color`);
  return { row, input, colorBtn };
}

/** Creates a labeled <select> dropdown with a color picker. */
export function createDropdownField(labelText, id, options, defaultColor = "#E5E6E8") {
  const select = document.createElement("select");
  select.id = id;
  options.forEach(option => {
    const optionEl = document.createElement("option");
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  });
  const { row, colorBtn } = createColorFieldRow(labelText, select, `${id}-color`);
  return { row, select, colorBtn };
}

/** Creates a labeled textarea with a color picker. */
export function createTextareaFieldWithColor(labelText, id, defaultColor = "#E5E6E8") {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

/** Creates a labeled field for entering image URLs. */
export function createImageField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

/** Creates a labeled field for entering video URLs. */
export function createVideoField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

/** Creates a Save/Cancel row with default button labels. */
export function createFormButtonRow(onCancel, saveText = "Save", cancelText = "Cancel") {
  const row = document.createElement("div");
  row.className = "field-row";
  row.style.justifyContent = "center";
  row.style.marginTop = "10px";
  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = saveText;
  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = cancelText;
  btnCancel.onclick = onCancel;
  row.append(btnSave, btnCancel);
  return row;
}

/** Creates a vertically scrollable container for lists (.def-list). */
export function createScrollableListBlock(maxHeight = "240px") {
  const wrapper = document.createElement("div");
  wrapper.className = "def-list ui-scrollbar";
  wrapper.style.maxHeight = maxHeight;
  wrapper.style.overflowY = "auto";
  wrapper.style.padding = "5px";
  return wrapper;
}
