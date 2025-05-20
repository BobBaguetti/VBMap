// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.1 — ensure swatch buttons reflect setColor()

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
 * wiring change/save → form "input" events, and keeping each
 * button’s own background in sync with the Pickr color.
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // create the Pickr widget
    const p = createPickr(`#${btn.id}`);
    pickrs[key] = p;

    // patch setColor so it also updates the swatch button
    const originalSetColor = p.setColor.bind(p);
    p.setColor = (color) => {
      originalSetColor(color);
      btn.style.backgroundColor = color;
    };

    // set the initial swatch background from Pickr’s default
    const initColor = p.getColor();
    let hex = "";
    if (initColor && typeof initColor.toHEXA === "function") {
      hex = initColor.toHEXA().toString();
    } else if (typeof initColor === "string") {
      hex = initColor;
    }
    if (hex) {
      btn.style.backgroundColor = hex;
    }

    // wire pickr → form change events
    p.on("change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    p.on("save", () => {
      form.dispatchEvent(new Event("input", { bubbles: true }));
      // make extra sure the swatch stays in sync after save
      const saved = p.getColor()?.toHEXA?.()?.toString?.();
      if (saved) btn.style.backgroundColor = saved;
    });

    // show the popover when you click the button
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
