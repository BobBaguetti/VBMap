/* Version: 5 */

const INLINE_SVGS = {
  trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke="#000000"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  coins: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#D4AF37" viewBox="0 0 256 256"><path d="M198.51,56.09C186.44,35.4,169.92,24,152,24H104C86.08,24,69.56,35.4,57.49,56.09,46.21,75.42,40,101,40,128s6.21,52.58,17.49,71.91C69.56,220.6,86.08,232,104,232h48c17.92,0,34.44-11.4,46.51-32.09C209.79,180.58,216,155,216,128S209.79,75.42,198.51,56.09ZM199.79,120h-32a152.78,152.78,0,0,0-9.68-48H188.7C194.82,85.38,198.86,102,199.79,120Zm-20.6-64H150.46a83.13,83.13,0,0,0-12-16H152C162,40,171.4,46,179.19,56ZM56,128c0-47.7,22-88,48-88s48,40.3,48,88-22,88-48,88S56,175.7,56,128Zm96,88H138.49a83.13,83.13,0,0,0,12-16h28.73C171.4,210,162,216,152,216Zm36.7-32H158.12a152.78,152.78,0,0,0,9.68-48h32C198.86,154,194.82,170.62,188.7,184Z"/></svg>`,

  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>`,

  plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>`,

  minus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"/></svg>`
};

/**
 * Creates an inline icon or Phosphor icon.
 * @param {string} name - Icon name ("plus", "minus", etc.)
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

    svg.style.display = "block";
    svg.style.margin = "auto";
    svg.style.width = "20px";
    svg.style.height = "20px";

    const hasFill = svg.getAttribute("fill") && svg.getAttribute("fill") !== "currentColor";
    if (!hasFill) {
      svg.style.fill = "#E5E6E8";
    }

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
