// @version: 1
// @file: /scripts/modules/utils/renderUtils.js

import { createIcon } from "./domUtils.js";

/**
 * Factory for list-entry renderers (Item, Chest, NPC, Quest).
 *
 * @param {Object} cfg
 * @param {string} cfg.baseClass       – e.g. "item-def-entry"
 * @param {(def:Object)=>string} cfg.headerHtml   – HTML for the top header section
 * @param {(def:Object)=>string} cfg.metaHtml     – HTML for name/meta below header
 * @param {(def:Object)=>string} [cfg.extraHtml]  – optional extra block
 * @param {(def:Object)=>string} [cfg.footerHtml] – optional footer block
 * @param {{ icon?:string, inline?:boolean }} [cfg.deleteIcon] – icon params
 *
 * @returns {(def:Object, layout:string, {onClick, onDelete})=>HTMLElement}
 */
export function makeEntryRenderer({
  baseClass,
  headerHtml,
  metaHtml,
  extraHtml = () => "",
  footerHtml = () => "",
  deleteIcon
}) {
  return function renderEntry(def, layout, { onClick, onDelete }) {
    const entry = document.createElement("div");
    entry.className = `${baseClass} layout-${layout}`;

    // Build core HTML
    entry.innerHTML = `
      <div class="entry-header">
        ${headerHtml(def)}
      </div>
      <div class="entry-meta">
        ${metaHtml(def)}
      </div>
      ${extraHtml(def)}
      ${footerHtml(def)}
    `;

    // Delete button
    if (onDelete) {
      const btn = document.createElement("button");
      btn.className = "entry-delete ui-button-delete";
      btn.innerHTML = deleteIcon
        ? createIcon(deleteIcon.icon, { inline: deleteIcon.inline }).outerHTML
        : "Delete";
      btn.onclick = e => {
        e.stopPropagation();
        if (def.id && confirm(`Delete "${def.name || def.id}"?`)) {
          onDelete(def.id);
        }
      };
      entry.appendChild(btn);
    }

    // Click handler
    if (onClick) {
      entry.addEventListener("click", () => onClick(def));
    }

    return entry;
  };
}
