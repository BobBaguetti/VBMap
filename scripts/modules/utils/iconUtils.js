// @version: 2
// @file: /scripts/modules/utils/iconUtils.js

const ICONS = {
    trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><path d="M216 48h-40V40a16 16 0 0 0-16-16h-64a16 16 0 0 0-16 16v8H40a8 8 0 0 0 0 16h8v152a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96ZM192 216H64V64h128ZM104 96v80a8 8 0 0 1-16 0V96a8 8 0 0 1 16 0Zm32 0v80a8 8 0 0 1-16 0V96a8 8 0 0 1 16 0Zm32 0v80a8 8 0 0 1-16 0V96a8 8 0 0 1 16 0Z"/></svg>`,
    coins: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><path d="M184 82.48v91c-11.7 5.26-27.24 8.52-44 8.52-37.59 0-68-14.33-68-32V91.29c11.7 5.26 27.24 8.51 44 8.51s32.3-3.25 44-8.51ZM128 64c-37.59 0-68 14.33-68 32s30.41 32 68 32 68-14.33 68-32-30.41-32-68-32Zm0-16c44.11 0 80 17.91 80 40v96c0 22.09-35.89 40-80 40s-80-17.91-80-40v-96c0-22.09 35.89-40 80-40Z"/></svg>`
  };
  
  /**
   * Create a Phosphor icon as inline SVG or fallback class-based <i>.
   * @param {string} name
   * @param {object} [options]
   * @param {boolean} [options.inline] - Whether to use inline SVG
   * @param {string} [options.className]
   * @param {object} [options.style]
   * @returns {HTMLElement}
   */
  export function createIcon(name, options = {}) {
    if (options.inline && ICONS[name]) {
      const span = document.createElement("span");
      span.innerHTML = ICONS[name];
      span.className = options.className || "";
      if (options.style) Object.assign(span.style, options.style);
      return span;
    }
  
    const el = document.createElement("i");
    el.classList.add("ph", `ph-${name}`);
    if (options.className) el.classList.add(...options.className.split(" "));
    if (options.style) Object.assign(el.style, options.style);
    return el;
  }
  
  /**
   * Create labeled text with an inline icon (e.g., value + coins)
   * @param {string} text
   * @param {string} iconName
   * @param {object} [options]
   * @returns {HTMLElement}
   */
  export function createLabeledIcon(text, iconName, options = {}) {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = options.className || "";
    const icon = createIcon(iconName, { inline: true });
    icon.style.marginLeft = "4px";
    span.appendChild(icon);
    return span;
  }
  