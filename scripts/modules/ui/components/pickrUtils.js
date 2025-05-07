// @file: /scripts/modules/ui/components/pickrUtils.js
// @version: 1.3 – removed ES import, now uses window.Pickr

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * @param {string} targetSelector - CSS selector for the target element
 * @param {string} defaultColor - initial color (hex string)
 * @returns {Pickr|object} Pickr instance or stub
 */
export function createPickr(targetSelector, defaultColor = '#E5E6E8') {
  const el = document.querySelector(targetSelector);
  if (!el || !window.Pickr) {
    console.warn(`Pickr target ${targetSelector} not found or Pickr not loaded`);
    // Stub
    return {
      on: () => {},
      setColor: () => {},
      getColor: () => ({ toHEXA: () => ({ toString: () => defaultColor }) }),
      getRoot: () => null
    };
  }

  const pickr = window.Pickr.create({
    el,
    theme: 'nano',
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
  }).on('save', (_, instance) => instance.hide());

  activePickrs.push(pickr);
  return pickr;
}

/**
 * Disable or enable a Pickr instance visually.
 * @param {Pickr|object} pickr
 * @param {boolean} disabled
 */
export function disablePickr(pickr, disabled = true) {
  const root = pickr?.getRoot?.();
  if (root && root.style) {
    root.style.pointerEvents = disabled ? 'none' : 'auto';
    root.style.opacity       = disabled ? 0.5  : 1;
  }
}

/**
 * Destroy all active Pickr instances.
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}
