// @version: 10.1
// @file: /scripts/modules/ui/uiKit.js

import { createPickr } from "./pickrManager.js";

// ------------------------------
// Basic Modal and Layout Helpers
// ------------------------------

/**
 * Creates a modal window with a centered layout, header title, and close button.
 * Accepts `size` ("small" or "large").
 * - Small modals do NOT use a backdrop and are directly appended to <body>.
 * - Large modals are wrapped in a .modal backdrop container.
 */
export function createModal({ id, title, onClose, size = "small" }) {
  const content = document.createElement('div');
  content.classList.add('modal-content');

  // Modal header
  const header = document.createElement('div');
  header.classList.add('modal-header');
  header.id = `${id}-handle`; // Optional use for handle or CSS

  const titleEl = document.createElement('h2');
  titleEl.textContent = title;

  const closeBtn = document.createElement('span');
  closeBtn.classList.add('close');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    closeModal(size === 'small' ? content : modal);
    if (onClose) onClose();
  });

  header.append(titleEl, closeBtn);
  content.append(header);

  if (size === "small") {
    content.classList.add("modal-small");
    content.style.display = "none";
    document.body.appendChild(content);
    return { modal: content, content, header };
  }

  const modal = document.createElement('div');
  modal.classList.add('modal', `modal-${size}`);
  modal.id = id;
  modal.appendChild(content);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(modal);
  return { modal, content, header };
}

/**
 * Hides the given modal element.
 */
export function closeModal(modalEl) {
  modalEl.style.display = "none";
}

/**
 * Shows the given modal element.
 */
export function openModal(modalEl) {
  modalEl.style.display = "block";
}

/**
 * Makes a modal content block draggable by clicking anywhere inside (except form fields).
 * This is useful for small modals without backdrop.
 */
export function makeDraggable(modalContent) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  modalContent.addEventListener("mousedown", (e) => {
    if (e.target.closest("input, textarea, select, button, .color-btn")) return;
    isDragging = true;
    offsetX = e.clientX - modalContent.offsetLeft;
    offsetY = e.clientY - modalContent.offsetTop;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    modalContent.style.left = `${e.clientX - offsetX}px`;
    modalContent.style.top = `${e.clientY - offsetY}px`;
    modalContent.style.position = "absolute";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });
}

// ------------------------------
// Modular Field Helpers
// ------------------------------

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

/**
 * Creates a stub element used as a color picker target.
 */
export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

/**
 * Combines a label, input, and color picker into a single row.
 */
export function createColorFieldRow(labelText, inputEl, colorId) {
  const row = document.createElement("div");
  row.classList.add("field-row");

  const label = document.createElement("label");
  label.textContent = labelText;

  const colorBtn = createColorButton(colorId);

  row.append(label, inputEl, colorBtn);
  return { row, colorBtn };
}

/**
 * Creates a labeled text input row with a color picker.
 */
export function createTextField(labelText, id, defaultColor = "#E5E6E8") {
  const input = document.createElement("input");
  input.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, input, `${id}-color`);
  return { row, input, colorBtn };
}

/**
 * Creates a labeled <select> dropdown with a color picker.
 */
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

/**
 * Creates a labeled textarea with a color picker.
 */
export function createTextareaFieldWithColor(labelText, id, defaultColor = "#E5E6E8") {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

/**
 * Creates a labeled field for entering image URLs.
 */
export function createImageField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

/**
 * Creates a labeled field for entering video URLs.
 */
export function createVideoField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

/**
 * Creates a Save/Cancel row with default button labels.
 */
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

// ------------------------------
// Modular Scrollable List Block
// ------------------------------

/**
 * Creates a vertically scrollable container for displaying
 * entries like item definitions, quests, etc.
 * Includes zebra-striping styles (from .def-list).
 */
export function createScrollableListBlock(maxHeight = "240px") {
  const wrapper = document.createElement("div");
  wrapper.className = "def-list ui-scrollbar";
  wrapper.style.maxHeight = maxHeight;
  wrapper.style.overflowY = "auto";
  wrapper.style.padding = "5px";
  return wrapper;
}

// ------------------------------
// Modular Extra Info Block
// ------------------------------

/**
 * Returns a block of dynamically addable "extra info" lines,
 * each with a text input and a color picker.
 */
export function createExtraInfoBlock(options = {}) {
  const {
    defaultColor = "#E5E6E8",
    readonly = false
  } = options;

  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");
  btnAdd.style.marginBottom = "8px";

  const lineWrap = document.createElement("div");

  wrap.append(btnAdd, lineWrap);

  let lines = [];

  /**
   * Re-renders all extra line rows in the DOM.
   */
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
      input.oninput = () => {
        lines[i].text = input.value;
      };

      const color = document.createElement("div");
      color.className = "color-btn";
      color.id = `extra-color-${i}`;
      color.style.marginLeft = "5px";

      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "ui-button";
      btnRemove.textContent = "×";
      btnRemove.style.marginLeft = "5px";
      btnRemove.onclick = () => {
        lines.splice(i, 1);
        render();
      };

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
    if (isReadonly) {
      btnAdd.style.display = "none";
    }
  }

  return { block: wrap, getLines, setLines };
}

