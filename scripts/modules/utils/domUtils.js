// @file: /scripts/modules/utils/domUtils.js
// @version: 1 – merged scroll & icon helpers

/**
 * Adds 'scrolling' class to elements while scrolling.
 * Used with .ui-scroll-float or any scrollable container.
 */
export function activateFloatingScrollbars() {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".ui-scroll-float, form").forEach(el => {
        let timeout;
        el.addEventListener("scroll", () => {
          el.classList.add("scrolling");
          clearTimeout(timeout);
          timeout = setTimeout(() => el.classList.remove("scrolling"), 600);
        });
      });
    });
  }
  
  // Inline SVGs map
  const INLINE_SVGS = {
    trash: `<svg …>…</svg>`,
    coins: `<svg …>…</svg>`,
    x:     `<svg …>…</svg>`
  };
  
  /**
   * Creates an icon element.
   * @param {string} name – Icon key in INLINE_SVGS or Phosphor (`ph ph-{name}`)
   * @param {object} [options]
   * @param {boolean} [options.inline=false] – Use inline SVG instead of <i> tag
   * @param {string} [options.className]      – CSS classes
   * @param {object} [options.style]          – Inline style overrides
   */
  export function createIcon(name, { inline = false, className = "", style = {} } = {}) {
    if (inline && INLINE_SVGS[name]) {
      const wrapper = document.createElement("span");
      wrapper.innerHTML = INLINE_SVGS[name];
      const svg = wrapper.firstChild;
      if (className) svg.classList.add(...className.split(" "));
      Object.assign(svg.style, style);
      return svg;
    }
    const el = document.createElement("i");
    el.classList.add("ph", `ph-${name}`);
    if (className) el.classList.add(...className.split(" "));
    Object.assign(el.style, style);
    return el;
  }
  
  /**
   * Creates a span with text + trailing inline icon.
   * @param {string} text
   * @param {string} iconName
   * @param {object} [options]
   */
  export function createLabeledIcon(text, iconName, options = {}) {
    const span = document.createElement("span");
    span.textContent = text;
    if (options.className) span.classList.add(...options.className.split(" "));
    const icon = createIcon(iconName, { inline: true, className: "inline-icon" });
    icon.style.marginLeft = "4px";
    span.appendChild(icon);
    return span;
  }
  