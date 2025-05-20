// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.2 — apply saved colors immediately in initFormPickrs

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * @param {string} targetSelector — CSS selector for the color‐button element
 * @param {string} defaultColor   — initial color hex
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
 * Initialize Pickr instances for form fields,
 * wiring change/save → form input events and applying any saved colors.
 *
 * @param {HTMLFormElement} form
 * @param {Object<string, HTMLElement>} fieldMap — map of colorKey → button element
 * @param {Object<string, string>} [initialColors={}] — map of colorKey → saved hex
 * @returns {Object<string, Pickr>} — map of colorKey → Pickr instance
 */
export function initFormPickrs(form, fieldMap, initialColors = {}) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // Create with default fallback
    const defaultColor = "#E5E6E8";
    const p = createPickr(`#${btn.id}`, defaultColor);
    pickrs[key] = p;

    // Immediately apply saved color if provided
    const saved = initialColors[key];
    if (typeof saved === "string" && saved) {
      p.setColor(saved);
    }

    // Wire form-input events on change/save
    p.on("change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    p.on("save", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );

    // Show picker on button click
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
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
