// =========================================================
// VBMap • Pickr Mixin
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/pickrMixin.js
// @version: 1.0  (2025‑05‑08)
// ---------------------------------------------------------
// Simplifies attaching multiple colour Pickrs to a form.
// Pass a map { key: buttonEl } and get a tiny API back:
//
//   const pickr = usePickrs(form, {
//     name : nameBtn,
//     type : typeBtn,
//     desc : descBtn
//   });
//
//   pickr.set({ name:"#ff0", type:"#0ff" });
//   const obj = pickr.get();          // { name:"#ff0", type:"#0ff", desc:"#E5E6E8" }
//   pickr.reset();                    // all to default
// =========================================================

import { attachColorSwatch, swatchHex } from "./colorSwatch.js";

export function usePickrs(form, buttonMap, defaultHex = "#E5E6E8") {
  const pickrs = {};

  /* attach lazily when form hits DOM */
  function ensure() {
    if (!document.body.contains(form)) { requestAnimationFrame(ensure); return; }
    Object.entries(buttonMap).forEach(([k, btn]) => {
      if (!pickrs[k]) pickrs[k] = attachColorSwatch(btn, form, defaultHex);
    });
  }
  ensure();

  function set(colorObj = {}) {
    ensure();
    Object.entries(colorObj).forEach(([k, hex]) => {
      pickrs[k]?.setColor(hex || defaultHex);
    });
  }

  function get() {
    ensure();
    return Object.fromEntries(
      Object.keys(buttonMap).map(k => [k, swatchHex(buttonMap[k], defaultHex)])
    );
  }

  function reset() {
    set({});
  }

  return { set, get, reset };
}
