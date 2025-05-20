// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 2.1 — respect data-default-color when initializing pickers

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * Falls back to a stub if the element doesn't exist.
 *
 * @param {string} targetSelector
 * @param {string} defaultColor  — hex string e.g. "#ff00cc"
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
 * Expects each button element to have a data-default-color attribute
 * set to the desired starting hex.
 *
 * @param {HTMLFormElement} form
 * @param {{[key: string]: HTMLElement}} fieldMap
 * @returns {{[key: string]: any}} map of pickr instances
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};

  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key]) return;
    if (!document.body.contains(btn)) return;

    // 1) Determine default color from data attribute
    const defaultColor = btn.dataset?.defaultColor || "#E5E6E8";

    // 2) Create the pickr with that default
    const p = createPickr(`#${btn.id}`, defaultColor);
    pickrs[key] = p;

    // 3) Immediately set the button's background
    btn.style.backgroundColor = defaultColor;

    // 4) Wire picker events to update button and trigger input
    const sync = () => {
      const c = getPickrHexColor(p);
      btn.style.backgroundColor = c;
      form.dispatchEvent(new Event("input", { bubbles: true }));
    };
    p.on("change", sync);
    p.on("save", sync);

    // 5) Show picker on button click
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
