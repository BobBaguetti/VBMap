// @file: /scripts/modules/ui/components/pickrUtils.js
// @version: 1.2 - low-level Pickr integration only

import Pickr from '@simonwep/pickr';  // adjust import as needed by your bundler

const activePickrs = [];

/**
 * Create a Pickr instance on the given selector.
 * @param {string} targetSelector - CSS selector for the target element
 * @param {string} defaultColor - initial color
 * @returns {Pickr} Pickr instance
 */
export function createPickr(targetSelector, defaultColor) {
  const pickr = Pickr.create({
    el: targetSelector,
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
 * @param {Pickr} pickr
 * @param {boolean} disabled
 */
export function disablePickr(pickr, disabled = true) {
  const root = pickr?.getRoot?.();
  if (root) {
    root.style.pointerEvents = disabled ? 'none' : 'auto';
    root.style.opacity = disabled ? 0.5 : 1;
  }
}

/**
 * Destroy all active Pickr instances.
 */
export function destroyAllPickrs() {
  activePickrs.forEach(p => p?.destroy?.());
  activePickrs.length = 0;
}
