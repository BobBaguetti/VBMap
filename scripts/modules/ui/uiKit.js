// @fullfile: Send the entire file, no omissions or abridgment — version is 0.2.0. Increase by 0.1.0 on significant API additions.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 0.2.0
// @file:    /scripts/modules/ui/uiKit.js

/**
 * Modal class encapsulates open/close logic, backdrop toggling, and ESC-key handling.
 * Usage:
 *   const modal = new Modal({
 *     modalSelector: '#my-modal',
 *     openBtnSelector: '.open-btn',
 *     closeBtnSelector: '.close-btn',
 *     onOpen: () => console.log('opened'),
 *     onClose: () => console.log('closed')
 *   });
 */
export class Modal {
  constructor({ modalSelector, openBtnSelector, closeBtnSelector, onOpen, onClose }) {
    this.modal = document.querySelector(modalSelector);
    this.openBtns = document.querySelectorAll(openBtnSelector);
    this.closeBtns = document.querySelectorAll(closeBtnSelector);
    this.onOpen = onOpen;
    this.onClose = onClose;
    this._handleEsc = this._handleEsc.bind(this);
    this._init();
  }

  _init() {
    this.openBtns.forEach(btn => btn.addEventListener('click', () => this.open()));
    this.closeBtns.forEach(btn => btn.addEventListener('click', () => this.close()));
  }

  _handleEsc(e) {
    if (e.key === 'Escape' && this.modal.classList.contains('open')) {
      this.close();
    }
  }

  open() {
    this.modal.classList.add('open');
    document.addEventListener('keydown', this._handleEsc);
    this.onOpen?.();
  }

  close() {
    this.modal.classList.remove('open');
    document.removeEventListener('keydown', this._handleEsc);
    this.onClose?.();
  }
}

/**
 * Initializes a Pickr color-picker instance on a given container.
 * @param {string} containerSelector  CSS selector of the element to mount Pickr to
 * @param {object} options            Additional Pickr configuration
 * @returns {Pickr}                   The created Pickr instance
 */
export function createColorPicker(containerSelector, options = {}) {
  const element = document.querySelector(containerSelector);
  if (!element) throw new Error(`Container not found: ${containerSelector}`);

  return Pickr.create({
    el: element,
    theme: options.theme || 'classic',
    default: options.defaultColor || '#FFFFFF',
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
    },
    ...options
  });
}

/**
 * ContextMenu class for building and displaying right-click menus.
 * Usage:
 *   const menu = new ContextMenu([
 *     { label: 'Edit', action: () => editItem() },
 *     { label: 'Delete', action: () => deleteItem() }
 *   ]);
 *   menu.showAt({ x: 100, y: 200 });
 */
export class ContextMenu {
  /**
   * @param {Array<{label: string, action: Function}>} items
   */
  constructor(items) {
    this.items = items;
    this.menu = null;
    this._onClickOff = this._onClickOff.bind(this);
  }

  /**
   * Display the context menu at the specified coordinates.
   * @param {{x: number, y: number}} coords
   */
  showAt(coords) {
    ContextMenu.removeExisting();
    this.menu = document.createElement('div');
    this.menu.className = 'context-menu';
    this.menu.style.position = 'absolute';
    this.menu.style.top = `${coords.y}px`;
    this.menu.style.left = `${coords.x}px`;

    this.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'context-menu__item';
      el.textContent = item.label;
      el.addEventListener('click', () => {
        item.action();
        this.destroy();
      });
      this.menu.appendChild(el);
    });

    document.body.appendChild(this.menu);
    document.addEventListener('click', this._onClickOff, { once: true });
  }

  /**
   * Cleanup the menu and remove click-off listener.
   */
  destroy() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
    document.removeEventListener('click', this._onClickOff);
  }

  /**
   * Handler to destroy menu when clicking outside.
   * @private
   */
  _onClickOff() {
    this.destroy();
  }

  /**
   * Remove any existing context menus from the document.
   */
  static removeExisting() {
    document.querySelectorAll('.context-menu').forEach(el => el.remove());
  }
}

// Future extensions:
// - Tooltip helpers
// - Standardized backdrop element management

// @version: 0.2.0
