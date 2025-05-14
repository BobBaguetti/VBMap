// @file: src/modules/sidebar/sidebarFilters.js
// @version: 1.4 — split NPC filters into hostile/friendly lists and fix selector logic

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";

/**
 * Sets up marker filtering and populates sidebar filters.
 */
export function setupSidebarFilters({
  searchBarSelector         = "#search-bar",
  mainFiltersSelector       = "#main-filters .toggle-group",
  pveToggleSelector         = "#toggle-pve",
  itemFilterListSelector    = "#item-filter-list",
  chestFilterListSelector   = "#chest-filter-list",
  npcHostileListSelector    = "#npc-hostile-list",
  npcFriendlyListSelector   = "#npc-friendly-list",
  layers,
  allMarkers,
  db
}) {
  const searchBar       = document.querySelector(searchBarSelector);
  const mainGroup       = document.querySelector(mainFiltersSelector);
  const pveToggle       = document.querySelector(pveToggleSelector);
  const itemFilterList  = document.querySelector(itemFilterListSelector);
  const chestFilterList = document.querySelector(chestFilterListSelector);
  const hostileList     = document.querySelector(npcHostileListSelector);
  const friendlyList    = document.querySelector(npcFriendlyListSelector);

  // ─── Main toggles ───────────────────────────────────────────────────
  if (mainGroup) {
    const ensureToggle = (layer, labelText) => {
      if (!mainGroup.querySelector(`input[data-layer="${layer}"]`)) {
        const lbl = document.createElement("label");
        lbl.innerHTML = `<input type="checkbox" checked data-layer="${layer}"/><span>${labelText}</span>`;
        mainGroup.appendChild(lbl);
        lbl.querySelector("input").addEventListener("change", filterMarkers);
      }
    };
    ["Chest","NPC","Quest","Misc"].forEach(type => {
      ensureToggle(type, type === "NPC" ? "NPCs" : type + (type!=="Misc" ? "s" : ""));
    });
  }

  // ─── Chest Filters ──────────────────────────────────────────────────
  if (chestFilterList && !chestFilterList.querySelector("input[type=checkbox]")) {
    [
      { lbl: "Small",       filter: "size",     key: "Small" },
      { lbl: "Medium",      filter: "size",     key: "Medium" },
      { lbl: "Large",       filter: "size",     key: "Large" },
      { lbl: "Dragonvault", filter: "category", key: "Dragonvault" },
      { lbl: "Normal",      filter: "category", key: "Normal" }
    ].forEach(o => {
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
      lbl.querySelector("input").addEventListener("change", filterMarkers);
    });
  }

  // ─── NPC Filters ────────────────────────────────────────────────────
  if (hostileList && friendlyList &&
      !hostileList.querySelector("input[type=checkbox]") &&
      !friendlyList.querySelector("input[type=checkbox]")) {

    ["Hostile","Friendly"].forEach(type => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `
        <input type="checkbox" checked data-npc-type="${type}"/>
        <span>${type}</span>
      `;
      if (type === "Hostile") {
        hostileList.appendChild(lbl);
      } else {
        friendlyList.appendChild(lbl);
      }
      lbl.querySelector("input").addEventListener("change", filterMarkers);
    });
  }

  /**
   * Core filter function applied to every marker.
   */
  function filterMarkers() {
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE   = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main level
      let mainVisible = true;
      mainGroup.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) {
          mainVisible = false;
        }
      });

      // Item level
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = itemFilterList.querySelector(
          `input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      // Chest level
      let chestVisible = true;
      if (data.type === "Chest") {
        chestVisible = false;
        chestFilterList.querySelectorAll("input[type=checkbox]").forEach(cb => {
          const f = cb.dataset.chestFilter;
          if (
            (f === "size"     && data.size     === cb.dataset.chestSize && cb.checked) ||
            (f === "category" && data.category === cb.dataset.chestCategory && cb.checked)
          ) chestVisible = true;
        });
      }

      // NPC level
      let npcVisible = true;
      if (data.type === "NPC") {
        npcVisible = false;
        // choose correct list based on data.npcType
        const list = data.npcType === "Hostile" ? hostileList : friendlyList;
        list.querySelectorAll("input[type=checkbox]").forEach(cb => {
          if (data.npcType === cb.dataset.npcType && cb.checked) {
            npcVisible = true;
          }
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
      shouldShow ? group.addLayer(markerObj) : group.removeLayer(markerObj);
    });
  }

  // ─── Wire core events ──────────────────────────────────────────────
  searchBar?.addEventListener("input", filterMarkers);
  pveToggle?.addEventListener("change", filterMarkers);
  mainGroup.querySelectorAll("input[type=checkbox]")
    .forEach(cb => cb.addEventListener("change", filterMarkers));

  /**
   * Populate item filters with their small images.
   */
  async function loadItemFilters() {
    if (!itemFilterList) return;
    itemFilterList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const lbl = document.createElement("label");
      const cb  = document.createElement("input");
      const img = document.createElement("img");
      const span= document.createElement("span");

      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.itemId = d.id;
      cb.addEventListener("change", filterMarkers);

      img.src       = d.imageSmall;
      img.alt       = d.name;
      img.className = "filter-icon";
      img.width     = 20;
      img.height    = 20;

      span.textContent = d.name;

      lbl.append(cb, img, span);
      itemFilterList.appendChild(lbl);
    });
  }

  return { filterMarkers, loadItemFilters };
}
