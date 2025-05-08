// @file: /scripts/modules/ui/pickrManager.js
// @version: 2.1 — suppress missing-element warnings

// Holds all active Pickr instances so destroyAllPickrs can clean them up
const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * Falls back to a stub if the element doesn't exist.
 */
export function createPickr(targetSelector, defaultColor = "#E5E6E8") {
  const el = document.querySelector(targetSelector);
  if (!el) {
-    console.warn(`Pickr target ${targetSelector} not found`);
    // silently fall back if the element isn’t in the DOM yet
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => defaultColor,
      getRoot: () => null
    };
  }

  const p = window.Pickr.create({
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

  activePickrs.push(p);
  return p;
}

/**
 * Disable or enable a Pickr instance visually and interactively.
 */
export function disablePickr(pickr, disabled = true) {
  const root = pickr?.getRoot?.();
  if (root && root.style) {
    root.style.pointerEvents = disabled ? "none" : "auto";
    root.style.opacity = disabled ? 0.5 : 1;
  }
}

/**
 * Get the current color from a Pickr instance in HEXA format.
 * @param {Pickr} pickr
 * @param {string} fallback
 * @returns {string} hex color string (e.g. "#E5E6E8")
 */
export function getPickrHexColor(pickr, fallback = "#E5E6E8") {
  return pickr?.getColor?.()?.toHEXA?.()?.toString?.() || fallback;
}

/**
 * Clean up all Pickrs created via this module.
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}

/**
 * Scan the given root element for any color‐swatch buttons,
 * log what we find, and attach Pickr to each one.
 */
export function initModalPickrs(root) {
  const swatches = root.querySelectorAll(".color-swatch");
  console.log("🔍 initModalPickrs: found", swatches.length, "swatches");
  swatches.forEach((el, i) => {
    console.log(`  [${i}] → id="${el.id}"`, el);
    const pickr = createPickr(`#${el.id}`);
    console.log("     ↳ created Pickr instance:", pickr);
  });
}
