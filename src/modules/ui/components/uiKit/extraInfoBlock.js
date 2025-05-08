// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 1.0 — dynamic extra‐info rows

import { createPickr } from "../../pickrManager.js";

export function createExtraInfoBlock({ defaultColor = "#E5E6E8", readonly = false } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";

  const lineWrap = document.createElement("div");
  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.className = "ui-button";
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
      color.className = "color-btn color-swatch";
      color.id = `extra-color-${i}`;
      color.style.marginLeft = "5px";

      const pickr = createPickr(`#${color.id}`);
      pickr.on("change", c => {
        line.color = c.toHEXA().toString();
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });
      pickr.on("save", c => {
        line.color = c.toHEXA().toString();
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });

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
      if (!readonly) row.append(btnRemove);
      lineWrap.append(row);
    });
  }

  btnAdd.onclick = () => {
    lines.push({ text: "", color: defaultColor });
    render();
    wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return {
    block: wrap,
    getLines: () => lines.map(l => ({ text: l.text, color: l.color })),
    setLines: (newLines, isReadonly = false) => {
      lines = newLines.map(l => ({ text: l.text || "", color: l.color || defaultColor }));
      render();
      btnAdd.style.display = isReadonly ? "none" : "";
    }
  };
}
