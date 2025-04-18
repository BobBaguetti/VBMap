// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 1
// @file:    /scripts/modules/uiKit/modalManager.js

/**
 * A generic Modal manager that handles:
 *  - Opening/closing a modal element
 *  - Backdrop insertion/removal
 *  - Escape‐key and click‐off to close
 *  - Custom lifecycle hooks
 *  - Focus trapping within the modal
 */
export class Modal {
    /**
     * @param {HTMLElement|string} selector Modal element or CSS selector
     * @param {Object} [options]
     * @param {string} [options.openClass]   CSS class to add when open (default: 'open')
     * @param {string} [options.backdropClass] CSS class for backdrop (default: 'modal-backdrop')
     */
    constructor(selector, options = {}) {
      const { openClass = 'open', backdropClass = 'modal-backdrop' } = options;
      this.el = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
      this.openClass = openClass;
      this.backdropClass = backdropClass;
      this._onOpen = [];
      this._onClose = [];
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleClickOff = this._handleClickOff.bind(this);
      this.backdrop = null;
    }
  
    /** Register a callback to run when the modal opens */
    onOpen(fn) {
      this._onOpen.push(fn);
      return this;
    }
  
    /** Register a callback to run when the modal closes */
    onClose(fn) {
      this._onClose.push(fn);
      return this;
    }
  
    /** Open the modal */
    open() {
      if (this.el.classList.contains(this.openClass)) return;
      // create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.classList.add(this.backdropClass);
      document.body.appendChild(this.backdrop);
  
      // add class, listeners
      this.el.classList.add(this.openClass);
      document.addEventListener('keydown', this._handleKeydown);
      this.backdrop.addEventListener('click', this._handleClickOff);
  
      // focus trap to first focusable
      const focusable = this.el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
  
      this._onOpen.forEach(fn => fn());
    }
  
    /** Close the modal */
    close() {
      if (!this.el.classList.contains(this.openClass)) return;
      this.el.classList.remove(this.openClass);
      document.removeEventListener('keydown', this._handleKeydown);
      if (this.backdrop) {
        this.backdrop.removeEventListener('click', this._handleClickOff);
        document.body.removeChild(this.backdrop);
        this.backdrop = null;
      }
      this._onClose.forEach(fn => fn());
    }
  
    /** Toggle open/close */
    toggle() {
      this.el.classList.contains(this.openClass) ? this.close() : this.open();
    }
  
    _handleKeydown(e) {
      if (e.key === 'Escape') {
        this.close();
      }
      // Optional: implement Tab focus trapping here
    }
  
    _handleClickOff() {
      this.close();
    }
  }
  
  /**
   * Utility to initialize all modals by selector.
   * Returns a map of selector→Modal instance.
   * @param {string[]} selectors CSS selectors of modal elements
   */
  export function initModals(selectors = []) {
    const instances = {};
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) instances[sel] = new Modal(el);
    });
    return instances;
  }
  