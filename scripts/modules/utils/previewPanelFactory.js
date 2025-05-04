// @file: /scripts/modules/utils/previewPanelFactory.js
// @version: 1.0 – generic definition preview panel

/**
 * Factory to create a preview panel given a small HTML-generator config.
 *
 * @param {Object} cfg
 * @param {string} cfg.containerIdClass  – e.g. "npc-preview-panel" (both id and class)
 * @param {(def:Object)=>string} cfg.headerHtml    – markup for the top header (icon, name, badges)
 * @param {(def:Object)=>string} cfg.statsHtml     – markup for the stats row (HP/DMG, value, etc.)
 * @param {(def:Object)=>string} [cfg.sectionsHtml] – array of additional HTML sections (slots, notes, etc.)
 */
export function makePreviewPanelFactory({
    containerIdClass,
    headerHtml,
    statsHtml,
    sectionsHtml = []
  }) {
    return function createPanel(container) {
      container.id = containerIdClass;
      container.className = `preview-panel ${containerIdClass}`;
  
      // clear and wrap
      container.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "preview-popup-wrapper";
      container.appendChild(wrapper);
  
      return {
        setFromDefinition(def) {
          if (!def) {
            wrapper.innerHTML = "";
            return;
          }
          wrapper.innerHTML = `
            ${headerHtml(def)}
            <div class="preview-stats">${statsHtml(def)}</div>
            ${sectionsHtml.map(fn => fn(def)).join("")}
          `;
        },
        show() { container.classList.add("visible"); },
        hide() { container.classList.remove("visible"); }
      };
    };
  }
  