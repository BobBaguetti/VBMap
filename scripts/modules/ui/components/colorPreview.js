// @file: /scripts/modules/ui/components/colorPreview.js
// @version: 1.1 – defer Pickr init until in-DOM

import { createPickr } from "./pickrUtils.js";

/**
 * Create a small color-preview button that pops up a Pickr.
 *
 * @param {{ initial: string, onChange: (hex:string)=>void }} opts
 * @returns {HTMLElement}
 */
export function createColorPreview({ initial, onChange }) {
  const btn = document.createElement("button");
  btn.id = `color-preview-${Math.random().toString(36).slice(2,8)}`;
  btn.className = "color-preview";
  btn.style.background = initial;

  // Wait until this btn is in the DOM before instantiating Pickr
  function init() {
    if (!document.body.contains(btn)) {
      requestAnimationFrame(init);
      return;
    }
    const pickr = createPickr(`#${btn.id}`, initial);
    pickr.on("change", (_, instance) => {
      const hex = instance.getColor().toHEXA().toString();
      btn.style.background = hex;
      onChange(hex);
    });
  }
  requestAnimationFrame(init);

  return btn;
}
