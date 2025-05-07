// @file: /scripts/modules/ui/components/modalShell.js
// @version: 1.0 – builds modal chrome (title, close-btn, optional divider)
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

/**
 * Enhances a core modal with a title and close button.
 *
 * @param {object} core
 * @param {HTMLElement} core.modal    – the backdrop container
 * @param {HTMLElement} core.header   – empty header placeholder from modalCore
 * @param {HTMLElement} core.content  – the content wrapper
 * @param {() => void} core.close     – function to close the modal
 * @param {object} options
 * @param {string} options.title         – title text to display
 * @param {boolean} [options.withDivider=false] – whether to insert an <hr> below the header
 */
export function createModalShell(core, { title, withDivider = false }) {
    const { modal, header, content, close } = core;
  
    // Clear any existing header content
    header.innerHTML = '';
  
    // Title element
    const titleEl = document.createElement('h2');
    titleEl.classList.add('modal-title');
    titleEl.textContent = title;
  
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.classList.add('modal-close-btn');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => close());
  
    // Assemble header
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
  
    // Optional divider
    if (withDivider) {
      const hr = document.createElement('hr');
      hr.classList.add('modal-divider');
      // Insert divider immediately after header
      content.insertBefore(hr, header.nextSibling);
    }
  
    return core;
  }
  