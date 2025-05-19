// @file: src/modules/definition/form/controller/pickrAdapter.js
// @version: 1.2 — sync swatch backgrounds on change/save

const activePickrs = [];

/**
 * Create a Pickr instance on the given target.
 * If `target` is a string, treat as selector; if HTMLElement, bind directly.
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
      on:       () => {},
      setColor: () => {},
      getColor: () => defaultColor,
      getRoot:  () => null,
      destroy:  () => {}
    };
  }

  const p = window.Pickr.create({
    el,
    theme:   "nano",
    default: defaultColor,
    components: {
      preview:    true,
      opacity:    true,
      hue:        true,
      interaction: { hex: true, rgba: true, input: true, save: true }
    }
  });
  activePickrs.push(p);
  return p;
}

/** Clean up all Pickr instances */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}

/**
 * Initialize Pickr for each swatch button, wiring change/save →
 * updating the button’s background + dispatching an “input” on the form.
 */
export function initFormPickrs(form, fieldMap) {
  const pickrs = {};
  Object.entries(fieldMap).forEach(([key, btn]) => {
    if (!btn || pickrs[key] || !document.body.contains(btn)) return;

    // 1) Create the Pickr bound to the button
    const p = createPickr(btn);
    pickrs[key] = p;

    // 2) Whenever the color changes or is saved, paint the button
    p.on("change", (_color, instance) => {
      try {
        const hex = instance.getColor().toHEXA().toString();
        btn.style.backgroundColor = hex;
      } catch {}
      form.dispatchEvent(new Event("input", { bubbles: true }));
    });
    p.on("save", (_color, instance) => {
      try {
        const hex = instance.getColor().toHEXA().toString();
        btn.style.backgroundColor = hex;
      } catch {}
      form.dispatchEvent(new Event("input", { bubbles: true }));
      instance.hide();
    });

    // 3) Clicking the swatch shows the picker
    btn.addEventListener("click", () => p.show());
  });

  return pickrs;
}
