// @version: 12
// @file: /scripts/modules/ui/uiKit.js

import { createPickr } from "./pickrManager.js";

// ------------------------------
// Smart Modal Creation
// ------------------------------

export function createModal({ id, title = "", onClose, size = "small" }) {
  if (size === "small") {
    const content = document.createElement("div");
    content.classList.add("modal-content", "modal-small");
    content.id = id;
    content.style.display = "none"; // 🛠️ Prevent auto-show on page load

    document.body.appendChild(content);
    return { modal: content, content };
  }

  const modal = document.createElement("div");
  modal.classList.add("modal", "modal-large");
  modal.id = id;

  const content = document.createElement("div");
  content.classList.add("modal-content");

  if (title) {
    const header = document.createElement("div");
    header.classList.add("modal-header");
    header.id = `${id}-handle`;

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
  }

  modal.appendChild(content);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(modal);
  return { modal, content };
}

export function closeModal(modal) {
  modal.style.display = "none";
}

export function openModal(modal) {
  modal.style.display = "block";
}

export function makeModalDraggable(modal, handle) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  handle.style.cursor = "move";

  handle.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    document.onmousemove = (e) => {
      if (isDragging) {
        modal.style.left = `${e.clientX - offsetX}px`;
        modal.style.top = `${e.clientY - offsetY}px`;
        modal.style.position = "absolute";
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

export function createModalHeader(titleText, onClose) {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.textContent = titleText;

  const close = document.createElement("span");
  close.className = "close";
  close.innerHTML = "&times;";
  close.onclick = () => onClose?.();

  header.append(title, close);
  return header;
}

export function createFormFooter(onCancel, onSave, {
  saveText = "Save",
  cancelText = "Cancel"
} = {}) {
  const row = document.createElement("div");
  row.className = "field-row";
  row.style.justifyContent = "center";
  row.style.marginTop = "10px";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = saveText;
  if (onSave) btnSave.addEventListener("click", onSave);

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = cancelText;
  btnCancel.onclick = onCancel;

  row.append(btnSave, btnCancel);
  return row;
}

// ------------------------------
// Fields
// ------------------------------

export function createFieldRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.classList.add("field-row");

  const label = document.createElement("label");
  label.textContent = labelText;

  row.appendChild(label);
  row.appendChild(inputEl);
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

  row.appendChild(label);
  row.appendChild(inputEl);
  row.appendChild(colorBtn);

  return { row, colorBtn };
}

export function createTextField(labelText, id, defaultColor = "#E5E6E8") {
  const input = document.createElement("input");
  input.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, input, `${id}-color`);
  return { row, input, colorBtn };
}

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

export function createTextareaFieldWithColor(labelText, id, defaultColor = "#E5E6E8") {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

export function createImageField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

export function createVideoField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

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

export function createScrollableListBlock(maxHeight = "240px") {
  const wrapper = document.createElement("div");
  wrapper.className = "def-list ui-scrollbar";
  wrapper.style.maxHeight = maxHeight;
  wrapper.style.overflowY = "auto";
  wrapper.style.padding = "5px";
  return wrapper;
}
