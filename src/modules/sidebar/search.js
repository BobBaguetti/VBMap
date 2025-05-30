// @file: src/modules/sidebar/search.js
// @version: 3.0 — include Item, Chest, and NPC definitions in search

import definitionsManager from "../../bootstrap/definitionsManager.js";

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

  // Clear button (does not hide dropdown)
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Ensure positioning context
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

  // Helpers to find filter inputs by type
  const getItemInput = id =>
    document.querySelector(
      `${itemFilterListSelector} input[data-item-id="${id}"]`
    );
  const getChestInput = id =>
    document.querySelector(
      `${chestFilterListSelector} input[data-chest-filter="category"][data-chest-category="${id}"],` +
      `${chestFilterListSelector} input[data-chest-filter="size"][data-chest-size="${id}"]`
    );
  const getNpcInput = id =>
    document.querySelector(
      `${npcHostileListSelector} input[data-npc-id="${id}"],` +
      `${npcFriendlyListSelector} input[data-npc-id="${id}"]`
    );

  // Pulls definitions for all types and tags them
  function loadAllDefinitions() {
    return [
      ...Object.values(definitionsManager.getDefinitions("Item")).map(d => ({ ...d, type: "Item" })),
      ...Object.values(definitionsManager.getDefinitions("Chest")).map(d => ({ ...d, type: "Chest" })),
      ...Object.values(definitionsManager.getDefinitions("NPC")).map(d => ({ ...d, type: "NPC" }))
    ];
  }

  // Renders the two-button UI per result
  function renderSuggestions(matches) {
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}" data-type="${def.type}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action toggle-btn">Toggle</button>
        <button class="suggestion-action show-only-btn">Show Only</button>
      </li>
    `).join("");

    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      const id   = item.dataset.id;
      const type = item.dataset.type;
      let input;

      // Choose the correct input based on type
      if (type === "Item")  input = getItemInput(id);
      if (type === "Chest") input = getChestInput(id);
      if (type === "NPC")   input = getNpcInput(id);

      // Toggle this filter on/off
      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        if (input) input.click();
      });

      // Show only this filter: uncheck all others across all types
      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        // 1) Main-layer: keep only Item checked if this is an Item; otherwise toggle off Item
        document.querySelectorAll(`${mainFiltersSelector} input[data-layer]`).forEach(i => {
          const shouldBeChecked = (type === "Item" && i.dataset.layer === "Item");
          if (i.checked !== shouldBeChecked) i.click();
        });
        // 2) Item filters
        document.querySelectorAll(`${itemFilterListSelector} input[data-item-id]`).forEach(i => {
          const keep = (type === "Item" && i.dataset.itemId === id);
          if (i.checked !== keep) i.click();
        });
        // 3) Chest filters
        document.querySelectorAll(`${chestFilterListSelector} input`).forEach(i => {
          const keep = (type === "Chest" && (i.dataset.chestCategory === id || i.dataset.chestSize === id));
          if (i.checked !== keep) i.click();
        });
        // 4) NPC filters
        document.querySelectorAll(
          `${npcHostileListSelector} input[data-npc-id],${npcFriendlyListSelector} input[data-npc-id]`
        ).forEach(i => {
          const keep = (type === "NPC" && i.dataset.npcId === id);
          if (i.checked !== keep) i.click();
        });
      });
    });
  }

  // Live search → suggestions
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }

    const allDefs = loadAllDefinitions();
    const matches = allDefs
      .filter(d => d.name?.toLowerCase().includes(q))
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
