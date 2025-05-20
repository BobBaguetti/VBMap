// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.1 — sync swatch button backgrounds on init, change, and save

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * Falls back to a stub if the element doesn't exist.
 */
export function createPickr(targetSelector, defaultColor = "#E5E6E8") {
  const el = document.querySelector(targetSelector);
  if (!el) {
    console.warn(`Pickr target ${targetSelector} not found`);
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => defaultColor,
      getRoot: () => null
    };
  }

  // Ensure the swatch element is styled
  el.style.width = "1.5rem";
  el.style.height = "1.5rem";
  el.style.borderRadius = "0.25rem";
  el.style.backgroundColor = defaultColor;

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

  // When Pickr changes or saves, update both the swatch and fire events
  p.on("change", instance => {
    const hex = instance.getColor().toHEXA().toString();
    el.style.backgroundColor = hex;
    instance.hide();
  });
  p.on("save", instance => {
    const hex = instance.getColor().toHEXA().toString();
    el.style.backgroundColor = hex;
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
    createPickr(`#${el.id}`);
  });
}

/**
 * Initialize Pickr instances for a set of buttons in a form,
 * wiring change/save → form "input" events, and syncing button styles.
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // Create Pickr on the button
    const p = createPickr(`#${btn.id}`, btn.dataset.defaultColor || "#E5E6E8");
    pickrs[key] = p;

    // On change/save: dispatch input event for live-preview
    p.on("change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    p.on("save", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );

    // Clicking the button shows the picker
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
