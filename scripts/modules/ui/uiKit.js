// /modules/ui/uiKit.js

export function createModal({ id, title, onClose }) {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.id = id;

  const content = document.createElement('div');
  content.classList.add('modal-content');

  // Header
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

  // Close on outside click
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

export function createFieldRow(labelText, inputEl) {
  const row = document.createElement('div');
  row.classList.add('field-row');

  const label = document.createElement('label');
  label.textContent = labelText;

  row.appendChild(label);
  row.appendChild(inputEl);
  return row;
}

// Create a color picker stub element (used with Pickr later)
export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

// Create a labeled input + color button row
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
