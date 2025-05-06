// @file: /scripts/modules/ui/components/layoutSwitcher.js
// @version: 2.0 - accessible, keyboard-navigable, dynamic options

/**
 * Creates an accessible layout switcher with ARIA roles and keyboard support.
 *
 * @param {Object} cfg
 * @param {string[]} cfg.available     - Array of layout names (e.g., ["row","stacked","gallery"])
 * @param {string}   cfg.defaultView   - The initially selected layout
 * @param {function} cfg.onChange      - Called with (newLayout) whenever selection changes
 * @returns {HTMLElement} The layout switcher element
 */
export function createLayoutSwitcher({ available, defaultView, onChange }) {
  const wrapper = document.createElement("div");
  wrapper.className = "layout-switcher";
  wrapper.setAttribute("role", "radiogroup");
  wrapper.setAttribute("aria-label", "Layout options");

  // Track current selection
  let selectedLayout = defaultView;

  available.forEach((layout) => {
    const btn = document.createElement("button");
    btn.textContent = layout;
    btn.className = layout === defaultView ? "active" : "";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", layout === defaultView);
    btn.tabIndex = layout === defaultView ? 0 : -1;

    // Click to select
    btn.addEventListener("click", () => {
      selectLayout(layout, btn);
    });

    // Keyboard navigation: arrows to move focus, Enter/Space to select
    btn.addEventListener("keydown", (e) => {
      const buttons = Array.from(wrapper.querySelectorAll('[role="radio"]'));
      const idx = buttons.indexOf(btn);
      let newIndex = null;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          newIndex = (idx + 1) % buttons.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          newIndex = (idx - 1 + buttons.length) % buttons.length;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          selectLayout(layout, btn);
          return;
      }

      if (newIndex !== null) {
        buttons[newIndex].focus();
        e.preventDefault();
      }
    });

    wrapper.appendChild(btn);
  });

  function selectLayout(layout, btn) {
    selectedLayout = layout;
    const buttons = wrapper.querySelectorAll('[role="radio"]');
    buttons.forEach((b) => {
      const isSelected = b === btn;
      b.setAttribute("aria-checked", isSelected);
      b.classList.toggle("active", isSelected);
      b.tabIndex = isSelected ? 0 : -1;
    });
    btn.focus();
    onChange(layout);
  }

  return wrapper;
}
