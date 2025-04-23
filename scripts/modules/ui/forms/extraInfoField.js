// @version: 1
// @file: /scripts/modules/ui/forms/extraInfoField.js

import { createPickr } from "../pickrManager.js";

const defaultColor = "#E5E6E8";

/**
 * Creates a reusable extra info field block with add/remove functionality.
 * @param {Object} [options]
 * @param {boolean} [options.readonly=false]
 * @returns {{
 *   block: HTMLElement,
 *   getLines: () => Array<{ text: string, color: string }>,
 *   setLines: (Array<{ text: string, color: string }>, boolean?) => void
 * }}
 */
export function createExtraInfoFieldBlock({ readonly = false } = {}) {
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

      const pickr = createPickr(`#${color.id}`, line.color || defaultColor);
      line._pickr = pickr;

      setTimeout(() => pickr.setColor(line.color || defaultColor), 0);
      pickr.on("change", colorObj => {
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
