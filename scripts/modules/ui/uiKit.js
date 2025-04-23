// UI Kit utility functions
// @file: /scripts/modules/ui/uiKit.js
// @version: 26

import { createPickr } from "./pickrManager.js";

// ─── Modal Lifecycle Utility ──────────────────────────────────────────────────

function attachModalLifecycle(modal) {
  const previouslyFocused = document.activeElement;
  const scrollY = window.scrollY;
  document.documentElement.style.overflow = "hidden";

  function restoreFocusAndScroll() {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    if (previouslyFocused?.focus) previouslyFocused.focus();
  }

  modal.dataset.lifecycleAttached = "true";
  modal.addEventListener("close", restoreFocusAndScroll, { once: true });
}

// ─── Modal Helpers ───────────────────────────────────────────────────────────

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
  modal.style.backgroundColor = backdrop ? "rgba(0, 0, 0, 0.5)" : "transparent";

  const content = document.createElement("div");
  content.classList.add("modal-content");

  if (size === "large") {
    Object.assign(content.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "550px",
      maxHeight: "90vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    });
  } else {
    Object.assign(content.style, {
      position: "absolute",
      transform: "none",
      width: "350px",
      maxWidth: "350px"
    });
  }

  const header = document.createElement("div");
  header.classList.add("modal-header");
  header.id = `${id}-handle`;
  header.style.cursor = draggable ? "move" : "default";

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
  if (withDivider) content.appendChild(document.createElement("hr"));
  modal.appendChild(content);

  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closeModal(modal);
      if (onClose) onClose();
    }
  });

  if (draggable && size !== "large") {
    makeModalDraggable(content, header);
  }

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
      modalEl.style.left = `${e2.clientX - offsetX}px`;
      modalEl.style.top = `${e2.clientY - offsetY}px`;
      modalEl.style.position = "absolute";
    };
    document.onmouseup = () => {
      dragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

export function closeModal(modal) {
  modal.style.display = "none";
  modal.dispatchEvent(new Event("close"));
}

export function openModal(modal) {
  modal.style.display = "block";
  requestAnimationFrame(() => {
    modal.style.backgroundColor = modal.classList.contains("modal-large")
      ? "rgba(0, 0, 0, 0.5)"
      : "transparent";
  });

  if (!modal.dataset.lifecycleAttached) {
    attachModalLifecycle(modal);
  }
}

export function openModalAt(modal, evt) {
  openModal(modal);
  const content = modal.querySelector(".modal-content");
  const rect = content.getBoundingClientRect();
  content.style.left = `${evt.clientX - rect.width}px`;
  content.style.top  = `${evt.clientY - rect.height / 2}px`;
}

// ─── Field Builders ───────────────────────────────────────────────────────────

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
  input.className = "ui-input";
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
  input.id = id;
  input.type = "text";
  return { row: createFieldRow(label, input), input };
}

export function createVideoField(label, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  return { row: createFieldRow(label, input), input };
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
  const { defaultColor = "#E5E6E8", readonly = false } = options;

  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";

  const lineWrap = document.createElement("div");

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");

  wrap.append(lineWrap, btnAdd);

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
      input.oninput = () => (line.text = input.value);

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
      line._pickr = pickr;

      setTimeout(() => {
        pickr.setColor(line.color || defaultColor);
      }, 0);

      pickr.on("change", (colorObj) => {
        line.color = colorObj.toHEXA().toString();
      });
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
    lines = newLines.map(l => ({
      text: l.text || "",
      color: l.color || defaultColor
    }));
    render();
    if (isReadonly) btnAdd.style.display = "none";
  }

  return { block: wrap, getLines, setLines };
}

// ─── Layout Switcher Control ─────────────────────────────────────────────────

export function createLayoutSwitcher({ available = ["row", "stacked", "gallery"], onChange, defaultView = "row" } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "layout-switcher";
  wrap.style.display = "flex";
  wrap.style.gap = "4px";

  const layouts = {
    row: { icon: "📄", label: "Row View" },
    stacked: { icon: "🧾", label: "Stacked View" },
    gallery: { icon: "🖼️", label: "Gallery View" }
  };

  available.forEach(layout => {
    const btn = document.createElement("button");
    btn.className = "ui-button layout-button";
    btn.title = layouts[layout]?.label || layout;
    btn.textContent = layouts[layout]?.icon || layout;
    btn.dataset.layout = layout;

    btn.onclick = () => {
      const all = wrap.querySelectorAll(".layout-button");
      all.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (onChange) onChange(layout);
    };

    wrap.appendChild(btn);
    if (layout === defaultView) btn.classList.add("active");
  });

  return wrap;
}
