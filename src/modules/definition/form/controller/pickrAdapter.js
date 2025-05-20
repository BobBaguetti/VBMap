// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.2 — force swatch backgrounds via !important

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
 * Get the current color from a Pickr instance in HEXA format.
 */
export function getPickrHexColor(pickr, fallback = "#E5E6E8") {
  const c = pickr?.getColor?.();
  return (c?.toHEXA?.()?.toString?.()) || fallback;
}

/**
 * Initialize Pickr instances for a set of buttons in a form,
 * wiring change/save → form "input" events and painting each
 * button’s background with the current color (with !important).
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key] || !document.body.contains(btn)) return;

    const p = createPickr(`#${btn.id}`);
    pickrs[key] = p;

    // helper to repaint the button
    const paint = () => {
      const hex = getPickrHexColor(p);
      // force background-color with !important
      btn.style.setProperty("background-color", hex, "important");
    };

    // override setColor so programmatic calls also repaint
    const _origSet = p.setColor.bind(p);
    p.setColor = (c) => {
      _origSet(c);
      paint();
    };

    // paint initial default
    paint();

    // whenever the user drags/inputs a new color
    p.on("change", () => {
      paint();
      form.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // when they hit “Save” in the picker
    p.on("save", () => {
      paint();
      form.dispatchEvent(new Event("input", { bubbles: true }));
      p.hide();
    });

    // show the picker on button-click
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
 * Clean up all Pickrs created via this module.
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}

/**
 * Scan the given root element for any color-swatch buttons
 * and attach modal‐style Pickr to each one.
 */
export function initModalPickrs(root) {
  const swatches = root.querySelectorAll(".color-swatch");
  swatches.forEach(el => {
    createPickr(`#${el.id}`);
  });
}
