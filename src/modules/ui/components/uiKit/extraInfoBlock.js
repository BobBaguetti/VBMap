// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 2.0 — flatten rows into siblings so they align with other fields

import { createPickr } from "../../pickrManager.js";
import { createFieldRow } from "./fieldKit.js";

/**
 * Creates a set of “Extra Info” rows, each as its own field row,
 * complete with divider <hr>s, top‐aligned label, color swatches,
 * and the “+” button also aligned in the input column.
 *
 * @param {object} opts
 * @param {boolean} opts.withDividers – wrap with <hr> above/below
 * @param {string}  opts.defaultColor – initial color for new lines
 * @param {boolean} opts.readonly     – hide the “+” button
 */
export function createExtraInfoRow({
  withDividers = true,
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  let lines = [];
  const container = document.createElement("div");
  container.style.display = "contents"; // collapse wrapper

  // divider elements
  const hrTop = document.createElement("hr");
  const hrBot = document.createElement("hr");
  hrTop.style.margin = "8px 0";
  hrBot.style.margin = "8px 0";

  // “+” button
  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.classList.add("ui-button");
  if (readonly) btnAdd.style.display = "none";
  btnAdd.addEventListener("click", () => {
    lines.push({ text: "", color: defaultColor });
    render();
    dispatchInput();
  });

  function dispatchInput() {
    container.closest("form")?.dispatchEvent(
      new Event("input", { bubbles: true })
    );
  }

  function render() {
    // clear out everything
    container.innerHTML = "";

    // top divider
    if (withDividers) container.append(hrTop);

    // label row
    const labelCell = document.createElement("span");
    const labelRow = createFieldRow("Extra Info:", labelCell);
    labelRow.style.alignItems = "flex-start";
    container.append(labelRow);

    // each existing extra‐info line
    lines.forEach((ln, idx) => {
      // text input
      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("ui-input");
      input.value = ln.text;
      input.addEventListener("input", e => {
        ln.text = e.target.value;
        dispatchInput();
      });

      // build a field row (blank label)
      const row = createFieldRow("", input);
      row.classList.add("extra-info-row");

      // color swatch
      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.classList.add("color-swatch");
      colorBtn.id = `extra-line-${idx}-color`;
      row.append(colorBtn);

      // remove button
      if (!readonly) {
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.classList.add("ui-button");
        btnRemove.textContent = "×";
        btnRemove.addEventListener("click", () => {
          lines.splice(idx, 1);
          render();
          dispatchInput();
        });
        row.append(btnRemove);
      }

      container.append(row);

      // defer Pickr init so the colorBtn is in the DOM
      setTimeout(() => {
        const pickr = createPickr(`#${colorBtn.id}`, ln.color);
        pickr.on("change", clr => {
          ln.color = clr.toHEXA()?.toString();
          dispatchInput();
        });
        pickr.on("save", clr => {
          ln.color = clr.toHEXA()?.toString();
          dispatchInput();
          pickr.hide();
        });
      }, 0);
    });

    // “+” button row
    const addRow = createFieldRow("", btnAdd);
    container.append(addRow);

    // bottom divider
    if (withDividers) container.append(hrBot);
  }

  // initial render (no default line here; controllers call setLines)
  render();

  return {
    container,
    getLines: () => lines.map(l => ({ text: l.text, color: l.color })),
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
