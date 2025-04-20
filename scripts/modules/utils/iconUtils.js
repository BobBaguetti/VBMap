// @version: 1
// @file: /scripts/modules/utils/iconUtils.js

/**
 * Returns an inline SVG element from the ICONS collection.
 * @param {string} name - Icon name.
 * @param {Object} options - Optional attributes like class name.
 * @returns {SVGElement}
 */
export function createIcon(name, options = {}) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", `icon ${options.class || ""}`.trim());
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
  
    const paths = ICONS[name];
    if (!paths) {
      console.warn(`Icon "${name}" not found in ICONS.`);
      return svg;
    }
  
    paths.forEach(d => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
  
    return svg;
  }
  
  export const ICONS = {
    coin: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M12 8v8",
      "M9 10h6",
      "M9 14h6"
    ]
  };
  