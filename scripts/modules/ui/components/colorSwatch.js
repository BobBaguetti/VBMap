// =========================================================
// VBMap • UI Component
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/colorSwatch.js
// @version: 1.0  (2025‑05‑05)
// ---------------------------------------------------------
// Lightweight helper that attaches a Pickr instance to any
// element (usually a <button class="color‑swatch">) and
// wires it back into its parent <form> so “input” events
// still fire for live previews & validation.
// =========================================================

import { createPickr }      from "../pickrManager.js";
import { getPickrHexColor } from "../../utils/colorUtils.js";

/**
 * Attach a Pickr colour picker to `btnEl`.
 *
 * @param {HTMLElement} btnEl    The element that opens Pickr (must have an id)
 * @param {HTMLFormElement=} formEl  If provided, an "input" event is re‑dispatched
 *                                   on the form whenever the colour changes/saves.
 * @param {string=} defaultHex   Fallback colour (default "#E5E6E8")
 * @returns {import('@simonwep/pickr').Pickr} The Pickr instance
 */
export function attachColorSwatch(btnEl, formEl = null, defaultHex = "#E5E6E8") {
  if (!btnEl) return null;

  // Reuse existing Pickr if already attached
  if (btnEl._pickr) return btnEl._pickr;

  // Ensure the button has an id; Pickr needs a CSS selector
  if (!btnEl.id) {
    btnEl.id = `swatch-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Create Pickr via central manager (keeps theme & defaults consistent)
  const pickr = createPickr(`#${btnEl.id}`, defaultHex);
  btnEl._pickr = pickr;

  // When colour changes, bubble "input" so live‑preview logic sees it
  const bubble = () => formEl?.dispatchEvent(new Event("input", { bubbles: true }));
  pickr.on("change", bubble).on("save", bubble);

  // Clicking the button opens the picker
  btnEl.addEventListener("click", () => pickr.show());

  return pickr;
}

/**
 * Convenience wrapper to read the current hex value from a swatch.
 *
 * @param {HTMLElement} btnEl    The same element passed to attachColorSwatch
 * @param {string=} fallbackHex  Fallback if picker not initialised
 * @returns {string}             Hex colour (e.g. "#AABBCC")
 */
export function swatchHex(btnEl, fallbackHex = "#E5E6E8") {
  return getPickrHexColor(btnEl?._pickr, fallbackHex);
}
