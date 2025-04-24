// @version: 8
// @file: /scripts/modules/ui/pickrManager.js

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector or element.
 * Falls back to a stub if the element doesn't exist.
 * Returns the Pickr instance.
 */
export function createPickr(target, defaultColor = "#E5E6E8") {
  // allow passing either a selector string or the element itself
  const el = typeof target === "string"
    ? document.querySelector(target)
    : target;

  if (!el) {
    console.warn(`Pickr target ${target} not found`);
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => ({ toHEXA: () => ({ toString: () => defaultColor }) }),
      getRoot: () => null
    };
  }

  // ensure every swatch has our “color-swatch” class for scoping
  el.classList.add("color-swatch");

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

  // paint the swatch immediately
  p.setColor(defaultColor);

  activePickrs.push(p);
  return p;
}

/**
 * Initialize all Pickr instances inside a given container element.
 * Only new swatches (with class "color-swatch") will get pickr-attached.
 */
export function initModalPickrs(container, defaultColor = "#E5E6E8") {
  if (!container || !container.querySelectorAll) return;
  container.querySelectorAll(".color-swatch").forEach(el => {
    // attach a Pickr once, store on element for reuse
    if (!el._pickr) {
      el._pickr = createPickr(el, defaultColor);
    }
  });
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
 * Destroy all Pickrs created via this module.
 * (You may not need to call this if you simply reset colors on Clear.)
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}
