/** src\shared\utils\iconUtils.js
 * 
 * Utility to generate icon elements for use in the UI.
 * Now supports inline SVGs for custom icons.
 */

// Inline SVG map
const INLINE_SVGS = {
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke="#000000"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  
    coins: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#D4AF37" viewBox="0 0 256 256"><path d="M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z"></path></svg>`,
  
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>`
  };
  
  /**
   * Creates an inline icon or Phosphor icon.
   * @param {string} name - Icon name ("coins", "trash")
   * @param {object} [options]
   * @param {boolean} [options.inline=false] - Whether to use inline SVG
   * @param {string} [options.className] - Additional CSS classes
   * @param {object} [options.style] - Optional inline styles
   */
  export function createIcon(name, options = {}) {
    const { inline = false, className = "", style = {} } = options;
  
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
   * Creates a span with label + trailing icon
   * @param {string} text
   * @param {string} iconName
   * @param {object} [options]
   */
  export function createLabeledIcon(text, iconName, options = {}) {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = options.className || "";
  
    const icon = createIcon(iconName, { inline: true, className: "inline-icon" });
    icon.style.marginLeft = "4px";
    span.appendChild(icon);
    return span;
  }
  