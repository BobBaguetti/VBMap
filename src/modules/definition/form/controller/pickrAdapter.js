// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.1 — bind Pickr directly to the element, not via selector

const activePickrs = [];

/**
 * Create a Pickr instance on the given target.
 * - If `target` is a string, we treat it as a selector.
 * - If `target` is an HTMLElement, we bind directly.
 * Falls back to a stub if the element can't be found.
 */
export function createPickr(target, defaultColor = "#E5E6E8") {
  let el = null;

  if (typeof target === "string") {
    el = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    el = target;
  }

  if (!el) {
    console.warn(`Pickr target ${target} not found`);
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
  });

  p.on("save", (color, instance) => {
    instance.hide();
  });

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
 * Scan the given root element for any color‐swatch buttons
 * and attach Pickr to each one.
 */
export function initModalPickrs(root) {
  const swatches = root.querySelectorAll(".color-swatch");
  swatches.forEach(el => {
    createPickr(el);
  });
}

/**
 * Initialize Pickr instances for a set of buttons in a form,
 * wiring change/save → form "input" events.
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // Bind directly to the button element
    const p = createPickr(btn);
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
