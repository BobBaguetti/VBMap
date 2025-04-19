// /modules/ui/uiKit.js

// ------------------------------
// Basic Modal and Layout Helpers
// ------------------------------

/**
 * Creates a modal with a header title and a close button.
 * Returns the modal element, content container, and header.
 */
export function createModal({ id, title, onClose }) {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.id = id;

  const content = document.createElement('div');
  content.classList.add('modal-content');

  // Modal header with title and close button
  const header = document.createElement('div');
  header.classList.add('modal-header');

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

  // Allow click outside modal to close it
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(modal);
  return { modal, content, header };
}

export function closeModal(modal) {
  modal.style.display = 'none';
}

export function openModal(modal) {
  modal.style.display = 'block';
}

/**
 * Creates a labeled row for any input or select element.
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
 * Creates a blank div that Pickr will attach to (color swatch).
 */
export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

/**
 * Creates a labeled row with a text/select field and a color picker button.
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

import { createPickr } from "./pickrManager.js";

/**
 * Creates a reusable block for managing extra info lines (text + color).
 * Useful in item/quest/marker modals.
 */
export function createExtraInfoBlock(options = {}) {
  const {
    defaultColor = "#E5E6E8",
    readonly = false
  } = options;

  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";

  // + Button to add a new line
  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");
  btnAdd.style.marginBottom = "8px";

  const lineWrap = document.createElement("div");

  wrap.appendChild(btnAdd);
  wrap.appendChild(lineWrap);

  let lines = [];

  /**
   * Rebuilds all the line DOM elements based on `lines` array.
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

      // Attach color picker and store reference on line
      const pickr = createPickr(`#${color.id}`);
      pickr.setColor(line.color || defaultColor);
      line._pickr = pickr;
    });
  }

  // Adds a new blank line
  btnAdd.onclick = () => {
    lines.push({ text: "", color: defaultColor });
    render();
  };

  /**
   * Returns array of { text, color } from all lines (including Pickr state).
   */
  function getLines() {
    return lines.map(l => ({
      text: l.text,
      color: l._pickr?.getColor()?.toHEXA()?.toString() || defaultColor
    }));
  }

  /**
   * Accepts array of { text, color } and optionally sets readonly mode.
   */
  function setLines(newLines, isReadonly = false) {
    lines = newLines.map(l => ({ text: l.text || "", color: l.color || defaultColor }));
    render();
    if (isReadonly) {
      btnAdd.style.display = "none";
    }
  }

  return { block: wrap, getLines, setLines };
}
