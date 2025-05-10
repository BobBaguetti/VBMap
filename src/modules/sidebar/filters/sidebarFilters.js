// @file: src/modules/sidebar/filters/sidebarFilters.js
// @version: 1.5 — reorder filter logic, add new main toggles

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

export async function renderSidebarFilters(allMarkers, db, layers) {
  const mainGroup = document.getElementById("main-filters");
  const itemList  = document.getElementById("item-filter-list");
  const searchBar = document.getElementById("search-bar");

  // inject additional toggles under mainGroup.toggle-group
  const tg = mainGroup.querySelector(".toggle-group");
  [
    { layer: "Chest",        label: "Chests" },
    { layer: "NPC-Hostile",  label: "Hostile NPCs" },
    { layer: "NPC-Friendly", label: "Friendly NPCs" },
    { layer: "Misc",         label: "Misc" }
  ].forEach(({layer, label}) => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" checked data-layer="${layer}"><span>${label}</span>`;
    tg.appendChild(lbl);
  });

  function filterMarkers() {
    const nameQ = (searchBar.value || "").toLowerCase();
    const pveOn = document.getElementById("toggle-pve")?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      // name & PvE
      const matchesName = data.name?.toLowerCase().includes(nameQ);
      const matchesPvE  = pveOn || data.type !== "Item";

      // main toggles: if any data-layer checkbox for this type is off, hide
      let mainVisible = true;
      mainGroup.querySelectorAll('input[data-layer]').forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      // per-item toggle
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = itemList.querySelector(`input[data-item-id="${data.predefinedItemId}"]`);
        if (cb && !cb.checked) itemVisible = false;
      }

      const shouldShow = matchesName && matchesPvE && mainVisible && itemVisible;
      if (shouldShow) layers[data.type]?.addLayer(markerObj);
      else           layers[data.type]?.removeLayer(markerObj);
    });
  }

  // wire toggles & search
  mainGroup.querySelectorAll('input[data-layer], #toggle-pve')
    .forEach(el => el.addEventListener("change", filterMarkers));
  if (searchBar) searchBar.addEventListener("input", filterMarkers);

  // item‐list loader
  async function loadItemFilters() {
    itemList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    const ids = [];
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" checked data-item-id="${d.id}"><span>${d.name}</span>`;
      label.querySelector("input").addEventListener("change", filterMarkers);
      itemList.appendChild(label);
      ids.push(d.id);
    });
    filterMarkers();
    return ids;
  }

  await loadItemFilters();
  filterMarkers();
  return { filterMarkers, loadItemFilters };
}
