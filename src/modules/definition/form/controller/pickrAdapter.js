// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.4 — wrap setColor to always repaint swatch immediately

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

  // Initial swatch styling
  el.style.width           = "1.5rem";
  el.style.height          = "1.5rem";
  el.style.borderRadius    = "0.25rem";
  el.style.backgroundColor = defaultColor;

  // Create Pickr
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
  });

  // Keep a direct reference to the swatch element
  p._swatchEl = el;

  // Wrap setColor to also repaint the swatch’s background immediately
  const origSetColor = p.setColor.bind(p);
  p.setColor = (color) => {
    origSetColor(color);
    let hex;
    if (typeof color === "string") {
      hex = color;
    } else {
      try {
        hex = color.toHEXA().toString();
      } catch {
        hex = defaultColor;
      }
    }
    p._swatchEl.style.backgroundColor = hex;
  };

  // Wire change/save events to dispatch custom events
  p.on("change", (color, instance) => {
    // we don’t need to repaint here since setColor covers both programmatic and user changes
    el.dispatchEvent(new Event("pickr-change"));
  });
  p.on("save", (color, instance) => {
    el.dispatchEvent(new Event("pickr-save"));
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
    root.style.opacity       = disabled ? 0.5    : 1;
  }
}

/**
 * Get the current color from a Pickr instance in HEXA format.
 */
export function getPickrHexColor(pickr, fallback = "#E5E6E8") {
  try {
    return pickr.getColor().toHEXA().toString();
  } catch {
    return fallback;
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
 * Scan a root element for any .color-swatch buttons and attach Pickr to each.
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

    const defaultColor = btn.dataset.defaultColor || "#E5E6E8";
    const p = createPickr(`#${btn.id}`, defaultColor);
    pickrs[key] = p;

    // On our custom pickr-change/save, trigger form input for live preview
    btn.addEventListener("pickr-change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    btn.addEventListener("pickr-save", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );

    // Show the picker when button clicked
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
