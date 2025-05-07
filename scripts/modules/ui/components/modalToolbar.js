// @file: /scripts/modules/ui/components/modalToolbar.js
// @version: 1.0 – shared toolbar configs and renderer

import { createIcon } from "../../utils/domUtils.js";

/**
 * Default toolbar buttons for all definition modals.
 * You can extend or override per‐modal via config.
 */
export const defaultToolbar = [];

/**
 * Render a toolbar button into a container.
 *
 * @param {{ icon?: string, label: string, onClick: (api:Object)=>void }} cfg
 * @param {HTMLElement} container
 * @param {Object} api – passed through to onClick
 */
export function renderToolbarButton(cfg, container, api = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toolbar-button";

  if (cfg.icon) {
    const iconEl = createIcon(cfg.icon, { inline: true, className: "toolbar-icon" });
    btn.appendChild(iconEl);
  }

  const text = document.createElement("span");
  text.textContent = cfg.label;
  btn.appendChild(text);

  btn.addEventListener("click", () => {
    try {
      cfg.onClick(api);
    } catch (err) {
      console.error("Toolbar button error:", err);
    }
  });

  container.appendChild(btn);
}
