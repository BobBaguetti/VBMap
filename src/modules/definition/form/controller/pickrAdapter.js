// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 2.0 — initialize swatch backgrounds and keep them in sync with Pickr

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
 * Initialize Pickr instances for a set of buttons in a form,
 * wiring change/save → form "input" events, and keeping
 * the button's background in sync with the color.
 *
 * @param {HTMLFormElement} form
 * @param {Object<string, HTMLElement>} fieldMap   // map of colorableKey → button element
 * @returns {Object<string, Pickr>}
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // 1) Create Pickr
    const p = createPickr(`#${btn.id}`);
    pickrs[key] = p;

    // 2) Initialize the button's background to the pickr's default color
    const initial = getPickrHexColor(p);
    btn.style.backgroundColor = initial;

    // 3) Wire Pickr events to update button color and trigger form input
    const sync = () => {
      const c = getPickrHexColor(p);
      btn.style.backgroundColor = c;
      form.dispatchEvent(new Event("input", { bubbles: true }));
    };
    p.on("change", sync);
    p.on("save", sync);

    // 4) Clicking the button shows the picker
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
