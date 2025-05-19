// @file: src/modules/sidebar/filters/itemFilters.js
// @version: 1.1 — updated to use standardized service API

import { getDefinitions } from "../../services/itemDefinitionsService.js";

export async function setupItemFilters(containerSelector, db, onChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = "";
  
  // Fetch all definitions using the new API
  const defs = await getDefinitions(db);
  
  // Only include those marked showInFilters
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
