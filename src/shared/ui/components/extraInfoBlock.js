// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 1.3 — attach Pickr instance to line for correct getLines()

import { createPickr } from "../forms/pickrManager.js";

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

      // ─── Pickr wiring ──────────────────────────────────────────
      const pickr = createPickr(`#${color.id}`);
      line._pickr = pickr;  // ← attach instance for getLines()

      // initialize pickr *after* its DOM root exists
      setTimeout(() => {
        pickr.setColor(line.color || defaultColor);
      }, 0);

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
