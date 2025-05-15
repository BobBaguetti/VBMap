// @file: src/modules/sidebar/filters/itemFilters.js
// @version: 1.0 — item-definition toggles with thumbnails

import { loadItemDefinitions } from "../../services/definitions/itemService.js";

export async function setupItemFilters(containerSelector, db, onChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = "";  
  const defs = await loadItemDefinitions(db);
  defs.filter(d => d.showInFilters).forEach(d => {
    const lbl = document.createElement("label");
    const cb  = document.createElement("input");
    const img = document.createElement("img");
    const span= document.createElement("span");
    cb.type           = "checkbox";
    cb.checked        = true;
    cb.dataset.itemId = d.id;
    cb.addEventListener("change", onChange);
    img.src       = d.imageSmall;
    img.alt       = d.name;
    img.className = "filter-icon";
    img.width     = 20;
    img.height    = 20;
    span.textContent = d.name;
    lbl.append(cb, img, span);
    container.appendChild(lbl);
  });
}
