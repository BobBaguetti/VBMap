// @file: src/shared/utils/iconUtils.js
// @version: 3 — added inline SVG for heart icon

/**
 * Utility to generate icon elements for use in the UI.
 * Now supports inline SVGs for custom icons.
 */

// Inline SVG map
const INLINE_SVGS = {
  trash: `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="24" height="24"
         viewBox="0 0 24 24"
         stroke-width="1.5"
         fill="none"
         stroke="#000000">
      <path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 
               16.0353 22H7.96474C6.99379 22 6.1631 21.3026 
               5.99496 20.3463L4 9"
            stroke-linecap="round"
            stroke-linejoin="round"/>
      <path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4
               C8.625 2.89543 9.52043 2 10.625 2H13.375
               C14.4796 2 15.375 2.89543 15.375 4V6
               M8.625 6L15.375 6"
            stroke-linecap="round"
            stroke-linejoin="round"/>
    </svg>`,

  coins: `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="18" height="18"
         fill="#D4AF37"
         viewBox="0 0 256 256">
      <path d="M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40
               c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44
               s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57Z
               M232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37
               C170.49,151.77,184,139,184,124V105.74
               C213.87,110.19,232,122.27,232,132Z">
      </path>
    </svg>`,

  x: `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="22" height="22"
         fill="currentColor"
         viewBox="0 0 256 256">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,
               61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,
               50.34,61.66A8,8,0,0,1,61.66,50.34L128,
               116.69l66.34-66.35a8,8,0,0,1,11.32,11.32
               L139.31,128Z"/>
    </svg>`,

  heart: `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         width="24" height="24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         class="heart-icon">
      <path d="M20.84 4.61
               a5.5 5.5 0 0 0-7.78 0
               L12 5.67
               l-1.06-1.06
               a5.5 5.5 0 1 0-7.78 7.78
               l1.06 1.06
               L12 21.23
               l7.78-7.78
               1.06-1.06
               a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`
};

// Phosphor fallback icon loader
export function createIcon(name, options = {}) {
  const { inline = false, className = "", style = {} } = options;

  if (inline && INLINE_SVGS[name]) {
    const wrapper = document.createElement("span");
    wrapper.innerHTML = INLINE_SVGS[name].trim();
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
