// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.5 — explicitly set initial color on each Pickr instance

const activePickrs = [];

/**
 * Create a Pickr instance on the given target.
 *
 * @param {string|HTMLElement} target — CSS selector or the .color-btn element itself
 * @param {string} defaultColor — initial HEX color
 */
export function createPickr(target, defaultColor = "#E5E6E8") {
  let el;
  if (typeof target === "string") {
    el = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    el = target;
  }
  if (!el) {
    console.warn(`Pickr target not found:`, target);
    return {
      on:       () => {},
      setColor: () => {},
      getColor: () => defaultColor,
      getRoot:  () => null,
      destroy:  () => {}
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
        hex:   true,
        rgba:  true,
        input: true,
        save:  true
      }
    }
  }).on("save", (_, instance) => instance.hide());

  // *** Ensure the swatch button shows the defaultColor immediately ***
  p.setColor(defaultColor);

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
    root.style.opacity       = disabled ? 0.5 : 1;
  }
}

/**
 * Initialize Pickr instances for form fields.
 *
 * @param {HTMLFormElement} form
 * @param {Object<string, HTMLElement>} fieldMap — map of colorKey → its button element
 * @param {Object<string, string>} [initialColors] — map of colorKey → initial HEX
 * @returns {Object<string, Pickr>} map of colorKey → Pickr instance
 */
export function initFormPickrs(form, fieldMap, initialColors = {}) {
  const pickrs = {};
  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!form.contains(btn)) return;

    // use saved color if present
    const defaultColor = initialColors[key] || "#E5E6E8";
    const p = createPickr(btn, defaultColor);
    pickrs[key] = p;

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
 * Safely retrieve a hex string from a Pickr instance.
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
