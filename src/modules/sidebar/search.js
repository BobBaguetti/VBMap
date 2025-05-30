// @file: src/modules/sidebar/search.js
// @version: 3.3 — prepend per-type icons in suggestion rows

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

  // Clear button setup
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Positioning context
  const wrapper = searchBar.parentNode;
  if (getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }

  // Suggestions container
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    wrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // Build unified list of definitions and chest keys
  function loadAllDefinitions() {
    const items = Object.values(definitionsManager.getDefinitions("Item"))
      .map(d => ({ id: d.id, name: d.name, type: "Item", icon: d.imageSmall }));
    const npcs = Object.values(definitionsManager.getDefinitions("NPC"))
      .map(d => ({ id: d.id, name: d.name, type: "NPC", icon: d.imageSmall }));
    const chestKeys = [
      { id: "Small",       name: "Small Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Medium",      name: "Medium Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Large",       name: "Large Chest", type: "Chest", iconClass: "ph-fill ph-package" },
      { id: "Normal",      name: "Normal Chest", type: "Chest", iconClass: "ph-fill ph-treasure-chest" },
      { id: "Dragonvault", name: "Dragonvault Chest", type: "Chest", iconClass: "ph-fill ph-treasure-chest" }
    ];
    return [
      ...items,
      ...chestKeys,
      ...npcs
    ];
  }

  // Render suggestions with icons
  function renderSuggestions(matches) {
    suggestionsList.innerHTML = matches.map(def => {
      let iconHtml;
      if (def.type === "Item" || def.type === "NPC") {
        iconHtml = `<img src="${def.icon}" class="suggestion-icon" alt="" />`;
      } else if (def.type === "Chest") {
        iconHtml = `<i class="suggestion-icon ${def.iconClass}"></i>`;
      }
      return `
        <li class="search-suggestion-item" data-id="${def.id}" data-type="${def.type}">
          ${iconHtml}
          <span class="suggestion-name">${def.name}</span>
          <button class="suggestion-action toggle-btn">Toggle</button>
          <button class="suggestion-action show-only-btn">Show Only</button>
        </li>
      `;
    }).join("");

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

  // Live search handler
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
      .slice(0, 10);

    if (matches.length) {
      renderSuggestions(matches);
      suggestionsList.classList.add("visible");
    } else {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
    }
  });
}
