// @file: /scripts/modules/ui/components/modalHeader.js
// @version: 1.0 – toolbar with layout-toggle logic
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

/**
 * Renders a toolbar into a header container, with buttons to switch layouts.
 *
 * @param {HTMLElement} headerEl
 *   The header element into which the toolbar will be injected. Should already
 *   contain title/close elements if needed.
 * @param {object}   options
 * @param {string[]} options.layouts
 *   Array of layout keys, e.g. ['list','grid','gallery'].
 * @param {string} [options.initial]
 *   The initially active layout key.
 * @param {(newLayout: string) => void} options.onLayoutChange
 *   Callback invoked when the user clicks a layout button.
 *
 * @returns {{ getCurrentLayout: () => string, setLayout: (layout: string) => void }}
 */
export function createModalHeader(headerEl, {
  layouts,
  initial = layouts[0],
  onLayoutChange,
}) {
  // Container for toolbar buttons
  const toolbar = document.createElement('div');
  toolbar.classList.add('modal-toolbar');

  // Track current selection
  let current = initial;

  layouts.forEach(layoutKey => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('modal-toolbar-btn', `layout-${layoutKey}`);
    btn.setAttribute('data-layout', layoutKey);
    btn.title = `Switch to ${layoutKey} view`;
    // You can replace these labels with icons if you like
    btn.textContent = layoutKey.charAt(0).toUpperCase() + layoutKey.slice(1);

    // Highlight initial
    if (layoutKey === initial) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      if (current === layoutKey) return;
      // Toggle active class
      toolbar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      current = layoutKey;
      onLayoutChange(layoutKey);
    });

    toolbar.appendChild(btn);
  });

  // Append toolbar to header (after existing content)
  headerEl.appendChild(toolbar);

  return {
    getCurrentLayout: () => current,
    setLayout: layoutKey => {
      if (!layouts.includes(layoutKey)) {
        throw new Error(`Invalid layout: ${layoutKey}`);
      }
      toolbar.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-layout') === layoutKey);
      });
      current = layoutKey;
      onLayoutChange(layoutKey);
    },
  };
}
