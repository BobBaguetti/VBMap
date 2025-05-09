// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 1.4 — add createExtraInfoRow helper

import { createPickr } from "../../pickrManager.js";
import { createFieldRow } from "./fieldKit.js";

/**
 * Builds a block of “extra info” lines with Pickr per line.
 *
 * @param {object} opts
 * @param {string} opts.defaultColor – hex string for new‐line swatches
 * @param {boolean} opts.readonly – hide the “+” button if true
 */
export function createExtraInfoBlock({
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  const wrap = document.createElement("div");
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
      });

      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.classList.add("color-swatch");
      colorBtn.id = `extra-line-${idx}-color`;
      row.append(input, colorBtn);

      // attach Pickr
      const pickr = createPickr(`#${colorBtn.id}`, ln.color);
      pickr.on("save", clr => {
        ln.color = clr.toHEXA().toString();
        pickr.hide();
      });

      lineWrap.append(row);
    });
  }

  function addLine() {
    lines.push({ text: "", color: defaultColor });
    render();
  }

  btnAdd.addEventListener("click", addLine);

  // initialize with one blank line if not readonly
  if (!readonly) addLine();

  return {
    block: wrap,
    getLines: () =>
      lines.map(l => ({ text: l.text, color: l.color })),
    setLines: (newLines = [], makeReadOnly = false) => {
      lines = newLines.map(l => ({
        text: l.text   || "",
        color: l.color || defaultColor
      }));
      render();
      if (makeReadOnly) btnAdd.style.display = "none";
    }
  };
}

/**
 * Drops your extra‐info block inside a <hr>…<hr> wrapper
 * and top‐aligns the label row automatically.
 *
 * @param {object} opts
 * @param {boolean} opts.withDividers – wrap with <hr> above/below
 * @param {string}  opts.defaultColor – passed to createExtraInfoBlock
 * @param {boolean} opts.readonly – passed to createExtraInfoBlock
 */
export function createExtraInfoRow({
  withDividers = true,
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  const { block, getLines, setLines } =
    createExtraInfoBlock({ defaultColor, readonly });

  // build the labeled row and force top‐alignment
  const row = createFieldRow("Extra Info:", block);
  row.style.alignItems = "flex-start";

  if (!withDividers) {
    return { row, block, getLines, setLines };
  }

  const container = document.createElement("div");
  const hrTop      = document.createElement("hr");
  const hrBottom   = document.createElement("hr");
  container.append(hrTop, row, hrBottom);

  return { container, row, block, getLines, setLines };
}
