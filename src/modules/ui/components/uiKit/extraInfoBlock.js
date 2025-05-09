// @file: src/modules/ui/components/uiKit/extraInfoBlock.js
// @version: 2.5 — re-add default blank line

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
  hrTop.style.margin = hrBot.style.margin = "8px 0";

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.textContent = "+";
  btnAdd.className = "ui-button";
  if (!readonly) {
    btnAdd.addEventListener("click", () => {
      lines.push({ text: "", color: defaultColor });
      render();
      dispatchInput();
    });
  } else {
    btnAdd.style.display = "none";
  }

  function dispatchInput() {
    container.closest("form")?.dispatchEvent(
      new Event("input", { bubbles: true })
    );
  }

  function render() {
    container.innerHTML = "";
    if (withDividers) container.append(hrTop);

    // Label row
    const labelRow = document.createElement("div");
    labelRow.className = "field-row";
    labelRow.style.display = "flex";
    labelRow.style.alignItems = "center";
    labelRow.style.marginBottom = "5px";
    const lbl = document.createElement("label");
    lbl.textContent = "Extra Info:";
    labelRow.append(lbl);
    container.append(labelRow);

    // Data lines
    lines.forEach((ln, idx) => {
      const input  = document.createElement("input");
      input.type   = "text";
      input.className = "ui-input";
      input.value  = ln.text;
      input.addEventListener("input", () => {
        ln.text = input.value; dispatchInput();
      });

      const row = createFieldRow("", input);
      row.classList.add("extra-info-row");

      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.className = "color-swatch";
      colorBtn.id = `extra-line-${idx}-color`;
      row.append(colorBtn);

      if (!readonly) {
        const btnRem = document.createElement("button");
        btnRem.type = "button";
        btnRem.className = "ui-button";
        btnRem.textContent = "×";
        btnRem.addEventListener("click", () => {
          lines.splice(idx,1); render(); dispatchInput();
        });
        row.append(btnRem);
      }

      container.append(row);

      setTimeout(() => {
        const pickr = createPickr(`#${colorBtn.id}`, ln.color||defaultColor);
        pickr.on("change", c => { ln.color = c.toHEXA().toString(); dispatchInput(); });
        pickr.on("save",   c => { ln.color = c.toHEXA().toString(); dispatchInput(); pickr.hide(); });
      }, 0);
    });

    // “+” row
    container.append(createFieldRow("", btnAdd));
    if (withDividers) container.append(hrBot);
  }

  // — initial population — 
  // re-add one blank extra‐info line by default
  if (!readonly) lines.push({ text: "", color: defaultColor });

  // first render
  render();

  return {
    container,
    getLines: () => lines.map(l => ({ text: l.text, color: l.color })),
    setLines: (newLines = [], makeReadOnly = false) => {
      lines = newLines.map(l => ({
        text: l.text||"", color: l.color||defaultColor
      }));
      render();
      if (makeReadOnly) btnAdd.style.display = "none";
    }
  };
}
