// @file: src/modules/sidebar/sidebarFilters.js
// @version: 1.1 — add Chest & NPC subfilters, Quest & Misc toggles

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";

/**
 * Sets up marker filtering:
 *   – name search
 *   – PvE toggle
 *   – main type toggles (Item, Chest, NPC, Quest, Misc)
 *   – item-specific filters
 *   – chest-specific filters (size + category)
 *   – NPC-specific filters (Hostile / Friendly)
 *
 * @param {object} params
 * @param {string} params.searchBarSelector       – selector for name-search input
 * @param {string} params.mainFiltersSelector     – selector for main filter checkbox container
 * @param {string} params.pveToggleSelector       – selector for PvE toggle checkbox
 * @param {string} params.itemFilterListSelector  – selector for item-filters container
 * @param {string} params.chestFilterListSelector – selector for chest-filters container
 * @param {string} params.npcFilterListSelector   – selector for NPC-filters container
 * @param {object<string,L.LayerGroup>} params.layers
 * @param {Array<{ markerObj: L.Marker, data: object }>} params.allMarkers
 * @param {firebase.firestore.Firestore} params.db
 *
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export function setupSidebarFilters({
  searchBarSelector       = "#search-bar",
  mainFiltersSelector     = "#main-filters .toggle-group",
  pveToggleSelector       = "#toggle-pve",
  itemFilterListSelector  = "#item-filter-list",
  chestFilterListSelector = "#chest-filter-list",
  npcFilterListSelector   = "#npc-filter-list",
  layers,
  allMarkers,
  db
}) {
  const searchBar      = document.querySelector(searchBarSelector);
  const mainGroup      = document.querySelector(mainFiltersSelector);
  const pveToggle      = document.querySelector(pveToggleSelector);
  const itemFilterList = document.querySelector(itemFilterListSelector);
  const chestFilterList= document.querySelector(chestFilterListSelector);
  const npcFilterList  = document.querySelector(npcFilterListSelector);

  // ─── Ensure main toggles for Chest, NPC, Quest, Misc ─────────────
  if (mainGroup) {
    const ensureToggle = (layer, labelText) => {
      if (!mainGroup.querySelector(`input[data-layer="${layer}"]`)) {
        const lbl = document.createElement("label");
        lbl.innerHTML = `<input type="checkbox" checked data-layer="${layer}"/><span>${labelText}</span>`;
        mainGroup.appendChild(lbl);
        lbl.querySelector("input")
           .addEventListener("change", filterMarkers);
      }
    };
    ensureToggle("Chest",  "Chests");
    ensureToggle("NPC",    "NPCs");
    ensureToggle("Quest",  "Quests");
    ensureToggle("Misc",   "Misc");
  }

  // ─── Chest Filters tier ────────────────────────────────────────────
  if (chestFilterList) {
    if (!chestFilterList.querySelector("input[type=checkbox]")) {
      const opts = [
        { lbl: "Small",       filter: "size",     key: "Small" },
        { lbl: "Medium",      filter: "size",     key: "Medium" },
        { lbl: "Large",       filter: "size",     key: "Large" },
        { lbl: "Dragonvault", filter: "category", key: "Dragonvault" },
        { lbl: "Normal",      filter: "category", key: "Normal" }
      ];
      opts.forEach(o => {
        const lbl = document.createElement("label");
        lbl.innerHTML = `
          <input
            type="checkbox"
            checked
            data-chest-filter="${o.filter}"
            ${o.filter==="size"     ? `data-chest-size="${o.key}"`     : ""}
            ${o.filter==="category" ? `data-chest-category="${o.key}"` : ""}
          />
          <span>${o.lbl}</span>
        `;
        chestFilterList.appendChild(lbl);
        lbl.querySelector("input")
           .addEventListener("change", filterMarkers);
      });
    }
  }

  // ─── NPC Filters tier ──────────────────────────────────────────────
  if (npcFilterList) {
    if (!npcFilterList.querySelector("input[type=checkbox]")) {
      ["Hostile","Friendly"].forEach(type => {
        const lbl = document.createElement("label");
        lbl.innerHTML = `
          <input type="checkbox" checked data-npc-type="${type}"/>
          <span>${type}</span>
        `;
        npcFilterList.appendChild(lbl);
        lbl.querySelector("input")
           .addEventListener("change", filterMarkers);
      });
    }
  }

  /**
   * Core filter function applied to every marker.
   */
  function filterMarkers() {
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName= data.name?.toLowerCase().includes(nameQuery);

      // type-level
      let mainVisible = true;
      mainGroup.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      // item-specific
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = itemFilterList.querySelector(`input[data-item-id="${data.predefinedItemId}"]`);
        if (cb && !cb.checked) itemVisible = false;
      }

      // chest-specific
      let chestVisible = true;
      if (data.type === "Chest" && chestFilterList) {
        chestVisible = false;
        chestFilterList.querySelectorAll("input[type=checkbox]").forEach(cb => {
          const f = cb.dataset.chestFilter;
          if (f === "size"     && data.size     === cb.dataset.chestSize     && cb.checked) chestVisible = true;
          if (f === "category" && data.category === cb.dataset.chestCategory && cb.checked) chestVisible = true;
        });
      }

      // NPC-specific (expects data.npcType === "Hostile"|"Friendly")
      let npcVisible = true;
      if (data.type === "NPC" && npcFilterList) {
        npcVisible = false;
        npcFilterList.querySelectorAll("input[type=checkbox]").forEach(cb => {
          if (data.npcType === cb.dataset.npcType && cb.checked) npcVisible = true;
        });
      }

      const shouldShow =
        matchesPvE &&
        matchesName &&
        mainVisible &&
        itemVisible &&
        chestVisible &&
        npcVisible;

      const group = layers[data.type];
      if (!group) return;
      shouldShow ? group.addLayer(markerObj)
                 : group.removeLayer(markerObj);
    });
  }

  // ─── Wire core events ──────────────────────────────────────────────
  searchBar?.addEventListener("input", filterMarkers);
  pveToggle?.addEventListener("change", filterMarkers);
  mainGroup.querySelectorAll("input[type=checkbox]")
    .forEach(cb => cb.addEventListener("change", filterMarkers));

  /**
   * Populate item filters from Firestore.
   */
  async function loadItemFilters() {
    if (!itemFilterList) return;
    itemFilterList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `
        <input type="checkbox" checked data-item-id="${d.id}" />
        <span>${d.name}</span>
      `;
      itemFilterList.appendChild(lbl);
      lbl.querySelector("input")
         .addEventListener("change", filterMarkers);
    });
  }

  return { filterMarkers, loadItemFilters };
}
