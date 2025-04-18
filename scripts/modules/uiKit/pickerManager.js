// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 1
// @file:    /scripts/modules/uiKit/pickerManager.js

import Pickr from '@simonwep/pickr'; // or wherever Pickr is imported from

/**
 * A small wrapper around Pickr.create to standardize theme & components.
 */
export class PickerManager {
  constructor() {
    this._pickers = new Set();
  }

  /**
   * Create a new Pickr instance with default nano theme & common options.
   * @param {HTMLElement|string} selector Element or selector for the container
   * @param {Object} [options] Additional Pickr config to merge
   * @returns {Pickr|null}
   */
  create(selector, options = {}) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!el) {
      console.warn(`PickerManager: element ${selector} not found`);
      return null;
    }

    const config = {
      el,
      theme: 'nano',
      default: '#E5E6E8',
      components: {
        // Main components
        preview: true,
        opacity: true,
        hue: true,
        // Interaction
        interaction: {
          hex: true,
          rgba: true,
          input: true,
          save: true
        }
      },
      ...options
    };

    const pickr = Pickr.create(config)
      .on('save', (instance, picker) => picker.hide());

    this._pickers.add(pickr);
    return pickr;
  }

  /**
   * Destroys all managed pickers.
   */
  destroyAll() {
    this._pickers.forEach(p => {
      try { p.destroyAndRemove(); }
      catch {}
    });
    this._pickers.clear();
  }

  /**
   * Remove a single picker instance.
   * @param {Pickr} pickr
   */
  remove(pickr) {
    if (this._pickers.has(pickr)) {
      try { pickr.destroyAndRemove(); }
      catch {}
      this._pickers.delete(pickr);
    }
  }
}

// Export a singleton for convenience
export const pickerManager = new PickerManager();
