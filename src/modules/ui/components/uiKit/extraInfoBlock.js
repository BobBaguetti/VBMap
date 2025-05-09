// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 1.9 — inner rows align with other fields via createFieldRow

import { createPickr } from "../../pickrManager.js";
import { createFieldRow } from "./fieldKit.js";

/**
 * Builds a block of “extra info” lines with Pickr per line.
 */
export function createExtraInfoBlock({
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  const wrap     = document.createElement("div");
  wrap.className = "extra-info-block";

  const lineWrap = document.createElement("div");
  const btnAdd   = document.createElement("button");
  btnAdd.type    = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");
  if (readonly) btnAdd.style.display = "none";

  wrap.append(lineWrap, btnAdd);

  let lines = [];

  function render() {
    lineWrap.innerHTML = "";
    lines.forEach((ln, idx) => {
      // — create the aligned row with blank label —
      const input = document.createElement("input");
      input.type = "text";
      input.className = "ui-input";
      input.value = ln.text;
      input.addEventListener("input", e => {
        ln.text = e.target.value;
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });

      const row = createFieldRow("", input);
      row.classList.add("extra-info-row");

      // — color swatch —
      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.classList.add("color-swatch");
      colorBtn.id = `extra-line-${idx}-color`;
      row.append(colorBtn);

      // — remove button —
      if (!readonly) {
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.classList.add("ui-button");
        btnRemove.textContent = "×";
        btnRemove.addEventListener("click", () => {
          lines.splice(idx, 1);
          render();
          wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
        });
        row.append(btnRemove);
      }

      lineWrap.append(row);

      // — defer Pickr init until after DOM insertion —
      setTimeout(() => {
        const pickr = createPickr(`#${colorBtn.id}`, ln.color);
        pickr.on("change", c => {
          ln.color = c.toHEXA().toString();
          wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
        });
        pickr.on("save", c => {
          ln.color = c.toHEXA().toString();
          wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
          pickr.hide();
        });
      }, 0);
    });
  }

  btnAdd.addEventListener("click", () => {
    lines.push({ text: "", color: defaultColor });
    render();
    wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  return {
    block: wrap,
    getLines: () => lines.map(l => ({ text: l.text, color: l.color })),
    setLines: (newLines = [], makeReadOnly = false) => {
      lines = newLines.map(l => ({
        text:  l.text  || "",
        color: l.color || defaultColor
      }));
      render();
      if (makeReadOnly) btnAdd.style.display = "none";
    }
  };
}

/**
 * Wraps the extra-info block in <hr>…<hr> and top-aligns the label.
 */
export function createExtraInfoRow({
  withDividers = true,
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  const { block, getLines, setLines } =
    createExtraInfoBlock({ defaultColor, readonly });

  const row = createFieldRow("Extra Info:", block);
  row.style.alignItems = "flex-start";

  if (!withDividers) {
    return { row, block, getLines, setLines };
  }

  const container = document.createElement("div");
  const hrTop      = document.createElement("hr");
  const hrBottom   = document.createElement("hr");
  hrTop.style.margin    = "8px 0";
  hrBottom.style.margin = "8px 0";

  container.append(hrTop, row, hrBottom);
  return { container, row, block, getLines, setLines };
}
