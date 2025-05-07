// @file: /scripts/modules/ui/components/extraInfoBuilder.js
// @version: 1.0 – dynamic extra‐info lines with color pickers

import { createTextAreaField } from "./fieldBuilders.js";
import { createColorPreview }  from "./colorPreview.js";

/**
 * Builds an “extra info” block: a vertical stack of
 * lines, each with text+color, plus a “+” to add more.
 *
 * Returns:
 *   {
 *     container: HTMLElement,   // wrapper div
 *     setLines(lines:Array<{text:string,color:string}>, clear=true),
 *     getLines(): Array<{text:string,color:string}>
 *   }
 */
export function createExtraInfoBlock() {
  const container = document.createElement("div");
  container.className = "extra-info-block";

  // Helper to create one line
  function makeLine(line = { text: "", color: "#E5E6E8" }) {
    const wrapper = document.createElement("div");
    wrapper.className = "extra-info-line";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "4px";
    wrapper.style.marginBottom = "4px";

    // text area
    const textarea = document.createElement("textarea");
    textarea.className = "ui-input";
    textarea.value = line.text;
    textarea.rows = 1;
    textarea.style.flex = "1";
    textarea.style.resize = "vertical";

    // color preview
    const colorBtn = createColorPreview({
      initial: line.color,
      onChange: hex => {
        colorBtn.dataset.currentColor = hex;
      }
    });

    // remove button
    const rm = document.createElement("button");
    rm.type = "button";
    rm.innerHTML = "×";
    rm.title = "Remove line";
    rm.className = "ui-button";
    rm.style.padding = "2px 6px";
    rm.onclick = () => {
      container.removeChild(wrapper);
    };

    // store initial color
    colorBtn.dataset.currentColor = line.color;

    wrapper.append(textarea, colorBtn, rm);
    return wrapper;
  }

  // “+” button to append
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+";
  addBtn.title = "Add extra line";
  addBtn.className = "ui-button";
  addBtn.style.marginTop = "4px";
  addBtn.onclick = () => {
    container.insertBefore(makeLine(), addBtn);
  };

  container.append(addBtn);

  return {
    container,
    setLines(lines = [], clear = true) {
      if (clear) {
        // remove everything except the addBtn
        container.innerHTML = "";
        container.append(addBtn);
      }
      lines.forEach(l => container.insertBefore(makeLine(l), addBtn));
    },
    getLines() {
      const out = [];
      container.querySelectorAll(".extra-info-line").forEach(wrapper => {
        const ta = wrapper.querySelector("textarea");
        const cb = wrapper.querySelector(".color-preview");
        out.push({
          text:  ta.value,
          color: cb?.dataset.currentColor || "#E5E6E8"
        });
      });
      return out;
    }
  };
}
