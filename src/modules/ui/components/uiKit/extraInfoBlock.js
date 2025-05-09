// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 1.8 — dispatch on pickr change/save & restore HR spacing

import { createPickr } from "../../pickrManager.js";
import { createFieldRow } from "./fieldKit.js";

/**
 * Builds a block of “extra info” lines with Pickr per line.
 *
 * @param {object} opts
 * @param {string} opts.defaultColor – hex string for new-line swatches
 * @param {boolean} opts.readonly     – hide the “+” button if true
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
      const row = document.createElement("div");
      row.className = "extra-info-row";

      const input = document.createElement("input");
      input.type = "text";
      input.value = ln.text;
      input.addEventListener("input", e => {
        ln.text = e.target.value;
        wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
      });

      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.classList.add("color-swatch");
      colorBtn.id = `extra-line-${idx}-color`;

      // append row, then defer Pickr init so element exists
      row.append(input, colorBtn);
      lineWrap.append(row);

      setTimeout(() => {
        const pickr = createPickr(`#${colorBtn.id}`, ln.color);
        pickr.on("change", clr => {
          ln.color = clr.toHEXA().toString();
          wrap.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
        });
        pickr.on("save", clr => {
          ln.color = clr.toHEXA().toString();
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
    getLines: () =>
      lines.map(l => ({ text: l.text, color: l.color })),
    setLines: (newLines = [], makeReadOnly = false) => {
      lines = newLines.map(l => ({
        text:  l.text   || "",
        color: l.color  || defaultColor
      }));
      render();
      if (makeReadOnly) btnAdd.style.display = "none";
    }
  };
}

/**
 * Wraps your extra-info block in <hr>…<hr> and top-aligns the label.
 *
 * @param {object} opts
 * @param {boolean} opts.withDividers – wrap with <hr> above/below
 * @param {string}  opts.defaultColor – passed to createExtraInfoBlock
 * @param {boolean} opts.readonly     – passed to createExtraInfoBlock
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

  // inline margins to match original spacing
  hrTop.style.margin    = "8px 0";
  hrBottom.style.margin = "8px 0";

  container.append(hrTop, row, hrBottom);
  return { container, row, block, getLines, setLines };
}
