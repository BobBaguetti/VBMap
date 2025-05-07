// @file: /scripts/modules/ui/components/pickrUtils.js
// @version: 1.1 - integrated defaultPickrColor from modalDefaults

import { attachColorSwatch, swatchHex } from "./colorSwatch.js";
import { defaultPickrColor } from "./modalDefaults.js";

//
// 1) usePickrs: attach multiple Pickr instances to form buttons
//
export function usePickrs(form, buttonMap, defaultHex = defaultPickrColor) {
  const pickrs = {};

  // Lazily attach pickrs once the form is in the DOM
  function ensure() {
    if (!document.body.contains(form)) {
      requestAnimationFrame(ensure);
      return;
    }
    Object.entries(buttonMap).forEach(([key, btn]) => {
      if (!pickrs[key]) {
        pickrs[key] = attachColorSwatch(btn, form, defaultHex);
      }
    });
  }
  ensure();

  return {
    // Set specific colors by key
    set(colorObj = {}) {
      ensure();
      Object.entries(colorObj).forEach(([key, hex]) => {
        pickrs[key]?.setColor(hex || defaultHex);
      });
    },
    // Retrieve current colors from the swatch buttons
    get() {
      ensure();
      return Object.fromEntries(
        Object.keys(buttonMap).map(key => [
          key,
          swatchHex(buttonMap[key], defaultHex)
        ])
      );
    },
    // Reset all pickrs to default color
    reset() {
      this.set({});
    }
  };
}

//
// 2) createPickr: instantiate a single Pickr on a target element
//
const activePickrs = [];

/**
 * Create a Pickr instance on the given selector or return a stub.
 * @param {string} targetSelector - CSS selector for the target button
 * @param {string} defaultColor - initial color
 * @returns {Pickr|object} Pickr instance or stub
 */
export function createPickr(targetSelector, defaultColor = defaultPickrColor) {
  const el = document.querySelector(targetSelector);
  if (!el) {
    console.warn(`Pickr target ${targetSelector} not found`);
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => ({ toHEXA: () => ({ toString: () => defaultColor }) }),
      getRoot: () => null
    };
  }

  const pickr = window.Pickr.create({
    el,
    theme: "nano",
    default: defaultColor,
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        hex: true,
        rgba: true,
        input: true,
        save: true
      }
    }
  }).on("save", (_, instance) => instance.hide());

  activePickrs.push(pickr);
  return pickr;
}

//
// 3) disablePickr: visually disable/enable a Pickr instance
//
export function disablePickr(pickr, disabled = true) {
  const root = pickr?.getRoot?.();
  if (root && root.style) {
    root.style.pointerEvents = disabled ? "none" : "auto";
    root.style.opacity       = disabled ? 0.5  : 1;
  }
}

//
// 4) destroyAllPickrs: clean up all created Pickr instances
//
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}

//
// 5) initModalPickrs: auto-initialize Pickr on all color-swatch buttons
//
export function initModalPickrs(root) {
  const swatches = root.querySelectorAll(".color-swatch");
  swatches.forEach(el => {
    createPickr(`#${el.id}`);
  });
}

//
// 6) getPickrHexColor: read a Pickr's color in HEXA format
//
export function getPickrHexColor(pickr, fallback = defaultPickrColor) {
  try {
    return pickr?.getColor?.()?.toHEXA?.()?.toString() || fallback;
  } catch {
    return fallback;
  }
}
