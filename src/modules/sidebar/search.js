// @file: src/modules/sidebar/search.js
// @version: 4.1 — removed ESC key handler (handled globally in events.js)

import definitionsManager from "../../bootstrap/definitionsManager.js";
import {
  toggleFilter,
  showOnlyFilter
} from "./filterActions.js";

/**
 * Initialize search suggestions that drive the sidebar’s filters.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector
 * @param {string} params.clearButtonSelector
 * @param {string} params.suggestionsListSelector
 * @param {string} params.mainFiltersSelector
 * @param {string} params.itemFilterListSelector
 * @param {string} params.chestFilterListSelector
 * @param {string} params.npcHostileListSelector
 * @param {string} params.npcFriendlyListSelector
 */
export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions",
  mainFiltersSelector     = "#main-filters .toggle-group",
  itemFilterListSelector  = "#item-filter-list",
  chestFilterListSelector = "#chest-filter-list",
  npcHostileListSelector  = "#npc-hostile-list",
  npcFriendlyListSelector = "#npc-friendly-list"
}) {
  const searchBar = document.querySelector(searchBarSelector);
  const clearBtn  = document.querySelector(clearButtonSelector);
  if (!searchBar || !clearBtn) {
    console.warn("[sidebarSearch] Missing elements");
    return;
  }

  // Clear button functionality
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Ensure wrapper is positioned relative
  const wrapper = searchBar.parentNode;
  if (getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }

  // Suggestions container creation or reference
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    wrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // === Prevent page scroll while cursor is over suggestions ===
  suggestionsList.addEventListener(
    "wheel",
    e => {
      const delta = e.deltaY;
      const atTop    = suggestionsList.scrollTop === 0;
      const atBottom = suggestionsList.scrollTop + suggestionsList.clientHeight >= suggestionsList.scrollHeight;

      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { passive: false }
  );

  // Build unified list of definitions and chest keys
  function loadAllDefinitions() {
    const items = Object.values(definitionsManager.getDefinitions("Item")).map(
      d => ({ id: d.id, name: d.name, type: "Item", icon: d.imageSmall })
    );
    const npcs = Object.values(definitionsManager.getDefinitions("NPC")).map(
      d => ({ id: d.id, name: d.name, type: "NPC", icon: d.imageSmall })
    );
    const chestKeys = [
      { id: "Small",       name: "Small Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Medium",      name: "Medium Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Large",       name: "Large Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Normal",      name: "Normal Chest", type: "Chest", iconClass: "ph-fill ph-treasure-chest" },
      { id: "Dragonvault", name: "Dragonvault Chest", type: "Chest", iconClass: "ph-fill ph-treasure-chest" }
    ];
    return [...chestKeys, ...items, ...npcs];
  }

  // Render suggestions with category headers
  function renderSuggestions(matches) {
    const byType = { Chest: [], Item: [], NPC: [] };
    matches.forEach(m => byType[m.type].push(m));

    let html = "";
    function appendItem(def) {
      let iconHtml;
      if (def.type === "Item" || def.type === "NPC") {
        iconHtml = `<img src="${def.icon}" class="suggestion-icon" alt="" />`;
      } else {
        iconHtml = `<i class="suggestion-icon ${def.iconClass}"></i>`;
      }
      html += `
        <li class="search-suggestion-item" data-id="${def.id}" data-type="${def.type}">
          ${iconHtml}
          <span class="suggestion-name">${def.name}</span>
          <button class="suggestion-action toggle-btn">Toggle</button>
          <button class="suggestion-action show-only-btn">Show Only</button>
        </li>
      `;
    }

    // Order: Chests, Items, NPCs
    if (byType.Chest.length) {
      html += `<li class="search-header">Chests</li>`;
      byType.Chest.forEach(def => appendItem(def));
    }
    if (byType.Item.length) {
      html += `<li class="search-header">Items</li>`;
      byType.Item.forEach(def => appendItem(def));
    }
    if (byType.NPC.length) {
      html += `<li class="search-header">NPCs</li>`;
      byType.NPC.forEach(def => appendItem(def));
    }

    suggestionsList.innerHTML = html;

    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      const id   = item.dataset.id;
      const type = item.dataset.type;

      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        toggleFilter(type, id, {
          itemFilterListSelector,
          chestFilterListSelector,
          npcHostileListSelector,
          npcFriendlyListSelector
        });
      });

      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        showOnlyFilter(
          type,
          id,
          {
            itemFilterListSelector,
            chestFilterListSelector,
            npcHostileListSelector,
            npcFriendlyListSelector
          },
          mainFiltersSelector
        );
      });
    });
  }

  // Live search → render
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }
    const allDefs = loadAllDefinitions();
    const matches = allDefs
      .filter(d => d.name.toLowerCase().includes(q))
      .slice(0, 50);

    if (matches.length) {
      renderSuggestions(matches);
      suggestionsList.classList.add("visible");
    } else {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
    }
  });
}
