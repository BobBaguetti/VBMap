// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.2 — fix change/save signature and sync swatch backgrounds on setColor

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

  // Style the swatch button for visibility
  el.style.width             = "1.5rem";
  el.style.height            = "1.5rem";
  el.style.borderRadius      = "0.25rem";
  el.style.backgroundColor   = defaultColor;

  // Instantiate Pickr
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

  // When the color changes (including manually via .setColor), sync background
  // Pickr's change signature is (color, instance)
  p.on("change", (color, instance) => {
    try {
      const hex = color.toHEXA().toString();
      el.style.backgroundColor = hex;
    } catch {
      // ignore
    }
  });

  // When the user clicks "Save" in the picker UI, also sync & hide
  p.on("save", (color, instance) => {
    try {
      const hex = color.toHEXA().toString();
      el.style.backgroundColor = hex;
    } catch {
      // ignore
    }
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

    // Create Pickr on the button, using any data-default-color if present
    const defaultColor = btn.dataset.defaultColor || "#E5E6E8";
    const p = createPickr(`#${btn.id}`, defaultColor);
    pickrs[key] = p;

    // Fire form input on change and save, so preview & state update
    p.on("change", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );
    p.on("save", () =>
      form.dispatchEvent(new Event("input", { bubbles: true }))
    );

    // Show the picker when the button is clicked
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
