// =========================================================
// VBMap • UI Component
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/colorSwatch.js
// @version: 1.1  (2025‑05‑05)
// =========================================================

import { createPickr }      from "./pickrUtils.js";
import { getPickrHexColor } from "../../utils/colorUtils.js";

/**
 * Attach a Pickr colour picker to `btnEl`.
 *
 * @param {HTMLElement} btnEl
 * @param {HTMLFormElement=} formEl
 * @param {string=} defaultHex
 * @returns {import('@simonwep/pickr').Pickr|null}
 */
export function attachColorSwatch(btnEl, formEl = null, defaultHex = "#E5E6E8") {
  if (!btnEl) return null;
  if (btnEl._pickr) return btnEl._pickr;                // already attached

  // Ensure an id so we have a stable selector
  if (!btnEl.id) btnEl.id = `swatch-${Math.random().toString(36).slice(2,8)}`;

  // Defer Pickr creation until the button is in the document
  function init() {
    if (!document.body.contains(btnEl)) {
      requestAnimationFrame(init);
      return;
    }

    const pickr = createPickr(`#${btnEl.id}`, defaultHex);
    btnEl._pickr = pickr;

    const bubble = () => formEl?.dispatchEvent(new Event("input", { bubbles: true }));
    pickr.on("change", bubble).on("save", bubble);

    btnEl.addEventListener("click", () => pickr.show());
  }
  init();

  return btnEl._pickr || null;  // Might be null until `init` runs
}

/** Safe hex getter */
export function swatchHex(btnEl, fb="#E5E6E8") {
  return getPickrHexColor(btnEl?._pickr, fb);
}
