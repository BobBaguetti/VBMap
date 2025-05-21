// @file: src/modules/definition/form/builder/extraInfoBlock.js
// @version: 1.6 — use FontAwesome icons, reorder buttons

import { createPickr } from "../controller/pickrAdapter.js";

export function createExtraInfoBlock({ defaultColor = "#E5E6E8", readonly = false } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "extra-info-block";

  const lineWrap = document.createElement("div");
  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.innerHTML = '<i class="fas fa-plus"></i>';
  btnAdd.className = "ui-button extra-info-add-btn";

  wrap.append(lineWrap, btnAdd);

  let lines = [];

  function render() {
    lineWrap.innerHTML = "";
    lines.forEach((line, i) => {
      const row = document.createElement("div");
      row.className = "field-row";

      const input = document.createElement("input");
      input.className = "ui-input";
      input.value = line.text;
      input.readOnly = readonly;
      input.oninput = () => {
        line.text = input.value;
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      };

      // remove button (×) — placed before the color swatch
      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.innerHTML = '<i class="fas fa-times"></i>';
      btnRemove.className = "ui-button extra-info-remove-btn";
      btnRemove.onclick = () => {
        lines.splice(i, 1);
        render();
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      };

      const color = document.createElement("div");
      color.className = "color-btn";
      color.id = `extra-color-${i}`;

      // assemble: input → remove → color
      row.append(input, btnRemove, color);
      lineWrap.appendChild(row);

      // ─── Pickr wiring ──────────────────────────────────────────
      const pickr = createPickr(`#${color.id}`);
      line._pickr = pickr;  // for getLines()

      // deferred color init (next tick)
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
    getLines: () =>
      lines.map(l => ({
        text:  l.text,
        color: l._pickr?.getColor()?.toHEXA()?.toString() || defaultColor
      })),
    setLines: (newLines, isReadonly = false) => {
      lines = newLines.map(l => ({ text: l.text || "", color: l.color || defaultColor }));
      render();
      if (isReadonly) btnAdd.style.display = "none";
    }
  };
}
