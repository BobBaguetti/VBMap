// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 2.2 — collapse label row into one column

import { createPickr } from "../../pickrManager.js";
import { createFieldRow } from "./fieldKit.js";

export function createExtraInfoRow({
  withDividers = true,
  defaultColor = "#E5E6E8",
  readonly     = false
} = {}) {
  let lines = [];
  const container = document.createElement("div");
  container.style.display = "contents";

  const hrTop = document.createElement("hr");
  const hrBot = document.createElement("hr");
  [hrTop, hrBot].forEach(hr => hr.style.margin = "8px 0");

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.className = "ui-button";
  if (readonly) btnAdd.style.display = "none";
  btnAdd.addEventListener("click", () => {
    lines.push({ text: "", color: defaultColor });
    render();
    dispatchInput();
  });

  function dispatchInput() {
    container.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function render() {
    container.innerHTML = "";

    if (withDividers) container.append(hrTop);

    // Label row: single column grid
    const labelRow = createFieldRow("Extra Info:", document.createElement("span"));
    labelRow.style.alignItems = "flex-start";
    labelRow.style.gridTemplateColumns = "auto";  // <-- collapse to one column
    container.append(labelRow);

    // Data lines...
    lines.forEach((ln, idx) => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "ui-input";
      input.value = ln.text;
      input.addEventListener("input", e => {
        ln.text = e.target.value;
        dispatchInput();
      });

      const row = createFieldRow("", input);
      row.classList.add("extra-info-row");

      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.className = "color-swatch";
      colorBtn.id = `extra-line-${idx}-color`;
      row.append(colorBtn);

      if (!readonly) {
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "ui-button";
        btnRemove.textContent = "×";
        btnRemove.addEventListener("click", () => {
          lines.splice(idx, 1);
          render();
          dispatchInput();
        });
        row.append(btnRemove);
      }

      container.append(row);

      setTimeout(() => {
        const pickr = createPickr(`#${colorBtn.id}`, ln.color || defaultColor);
        pickr.on("change", c => {
          ln.color = c.toHEXA().toString();
          dispatchInput();
        });
        pickr.on("save", c => {
          ln.color = c.toHEXA().toString();
          dispatchInput();
          pickr.hide();
        });
      }, 0);
    });

    // “+” button row
    container.append(createFieldRow("", btnAdd));

    if (withDividers) container.append(hrBot);
  }

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
