// @file: src/modules/ui/components/formPickrManager.js
// @version: 1.0 — shared Pickr wiring for forms

import { createPickr } from "../../utils/pickrManager.js";

/**
 * Initialize Pickr instances for a set of buttons in a form,
 * wiring change/save → form "input" events.
 *
 * @param {HTMLFormElement} form
 * @param {Record<string,HTMLElement>} fieldMap
 *        mapping keys (e.g. "name", "rarity") → the color-swatch buttons
 * @returns {Record<string, Pickr>}  map of Pickr instances created
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    // make sure the button actually exists in the DOM
    if (!document.body.contains(btn)) return;

    // create the Pickr
    const p = createPickr(`#${btn.id}`);
    pickrs[key] = p;

    // whenever you change or save, fire an "input" on the form
    p.on("change", () => form.dispatchEvent(new Event("input", { bubbles: true })));
    p.on("save",   () => form.dispatchEvent(new Event("input", { bubbles: true })));

    // clicking the swatch opens the picker
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
