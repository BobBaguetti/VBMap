// @file: /scripts/modules/ui/components/fieldBuilders.js
// @version: 1.2 – fixed createPickr import path

import { createPickr } from "../pickrManager.js";  // fixed import path from pickrManager

/**
 * Simple row with a label and an input element.
 */
export function createFieldRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.classList.add("field-row");
  const label = document.createElement("label");
  label.textContent = labelText;
  row.append(label, inputEl);
  return row;
}

/**
 * A standalone color-swatch button.
 */
export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.id = id;
  return btn;
}

/**
 * Combines a label, an input/select, and a color button.
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
 * Dropdown with optional color swatch.
 */
export function createDropdownField(
  label,
  id,
  options = [],
  { showColor = true } = {}
) {
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

/**
 * Text input with a color swatch.
 */
export function createTextField(label, id) {
  const input = document.createElement("input");
  input.id = id;
  input.className = "ui-input";
  const { row, colorBtn } = createColorFieldRow(label, input, `${id}-color`);
  return { row, input, colorBtn };
}

/**
 * Textarea with a color swatch.
 */
export function createTextareaFieldWithColor(label, id) {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(label, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

/**
 * Simple single-line text field for URLs/images.
 */
export function createImageField(label, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  return { row: createFieldRow(label, input), input };
}

/**
 * Simple single-line text field for video URLs.
 */
export function createVideoField(label, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  return { row: createFieldRow(label, input), input };
}

/**
 * Reusable extra-info block with dynamic rows and color pickers.
 */
export function createExtraInfoBlock({ defaultColor = "#E5E6E8", readonly = false } = {}) {
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
      input.oninput = () => {
        line.text = input.value;
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
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
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      };

      row.append(input, color);
      if (!readonly) row.appendChild(btnRemove);
      lineWrap.appendChild(row);

      const pickr = createPickr(`#${color.id}`);
      line._pickr = pickr;
      setTimeout(() => pickr.setColor(line.color || defaultColor), 0);

      pickr.on("change", colorObj => {
        line.color = colorObj.toHEXA().toString();
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });
      pickr.on("save", colorObj => {
        line.color = colorObj.toHEXA().toString();
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  btnAdd.onclick = () => {
    lines.push({ text: "", color: defaultColor });
    render();
    wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return {
    block: wrap,
    getLines: () => lines.map(l => ({
      text: l.text,
      color: l._pickr?.getColor()?.toHEXA()?.toString() || defaultColor
    })),
    setLines: (newLines, isReadonly = false) => {
      lines = newLines.map(l => ({ text: l.text || "", color: l.color || defaultColor }));
      render();
      if (isReadonly) btnAdd.style.display = "none";
    }
  };
}
