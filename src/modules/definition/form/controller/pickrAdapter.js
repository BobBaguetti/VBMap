// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.2 — guard against null initialColors in initFormPickrs

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * @param {string} targetSelector — CSS selector for the .color-btn element
 * @param {string} defaultColor — initial color hex
 */
export function createPickr(targetSelector, defaultColor = "#E5E6E8") {
  const el = document.querySelector(targetSelector);
  if (!el) {
    console.warn(`Pickr target ${targetSelector} not found`);
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => defaultColor,
      getRoot: () => null,
      destroy: () => {}
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
 * Initialize Pickr instances for form fields.
 *
 * @param {HTMLFormElement} form
 * @param {Object<string, HTMLElement>} fieldMap — map of colorable fieldKey to its button element
 * @param {Object<string, string>} [initialColors] — map of fieldKey to initial hex color
 * @returns {Object<string, Pickr>} — map of fieldKey to Pickr instance
 */
export function initFormPickrs(form, fieldMap, initialColors) {
  const pickrs = {};
  const colors = initialColors || {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // Use saved color if provided, otherwise default
    const defaultColor = colors[key] || "#E5E6E8";
    const p = createPickr(`#${btn.id}`, defaultColor);
    pickrs[key] = p;

    // Wire up form "input" events on color change
    p.on("change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    p.on("save", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );

    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}

/**
 * Disable or enable a Pickr instance visually.
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
 */
export function getPickrHexColor(pickr, fallback = "#E5E6E8") {
  try {
    return pickr?.getColor?.()?.toHEXA?.()?.toString?.() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Destroy all Pickr instances created via this module.
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}
