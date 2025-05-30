// @file: src/modules/sidebar/search.js
// @version: 3.1.1 — reorder chest entries in search results

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

  // Ensure wrapper is positioned
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

  // Helpers to locate each filter toggle in the sidebar
  const getItemInput = id =>
    document.querySelector(
      `${itemFilterListSelector} input[data-item-id="${id}"]`
    );
  const getChestInput = key =>
    document.querySelector(
      `${chestFilterListSelector} input[data-chest-filter="size"][data-chest-size="${key}"],` +
      `${chestFilterListSelector} input[data-chest-filter="category"][data-chest-category="${key}"]`
    );
  const getNpcInput = id =>
    document.querySelector(
      `${npcHostileListSelector} input[data-npc-id="${id}"],` +
      `${npcFriendlyListSelector} input[data-npc-id="${id}"]`
    );

  // Build a unified list of search entries
  function loadAllDefinitions() {
    // Items & NPCs from definitions
    const items = Object.values(definitionsManager.getDefinitions("Item"))
      .map(d => ({ id: d.id, name: d.name, type: "Item" }));
    const npcs = Object.values(definitionsManager.getDefinitions("NPC"))
      .map(d => ({ id: d.id, name: d.name, type: "NPC" }));

    // Chest “definitions” in the desired order
    const chestKeys = [
      { id: "Small",       name: "Small Chest" },
      { id: "Medium",      name: "Medium Chest" },
      { id: "Large",       name: "Large Chest" },
      { id: "Normal",      name: "Normal Chest" },
      { id: "Dragonvault", name: "Dragonvault Chest" }
    ].map(o => ({ ...o, type: "Chest" }));

    return [...items, ...chestKeys, ...npcs];
  }

  // Render the Toggle & Show Only buttons
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

      if (type === "Item")  input = getItemInput(id);
      if (type === "Chest") input = getChestInput(id);
      if (type === "NPC")   input = getNpcInput(id);

      // Toggle this filter on/off
      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        if (input) input.click();
      });

      // Show only this filter: uncheck all others across all types
      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        // Main-layer: only "Item" on if this is an Item; otherwise turn it off
        document.querySelectorAll(`${mainFiltersSelector} input[data-layer]`)
          .forEach(i => {
            const want = (type === "Item" && i.dataset.layer === "Item");
            if (i.checked !== want) i.click();
          });
        // Items
        document.querySelectorAll(`${itemFilterListSelector} input[data-item-id]`)
          .forEach(i => {
            const want = (type === "Item" && i.dataset.itemId === id);
            if (i.checked !== want) i.click();
          });
        // Chests
        document.querySelectorAll(`${chestFilterListSelector} input`)
          .forEach(i => {
            const key = i.dataset.chestSize || i.dataset.chestCategory;
            const want = (type === "Chest" && key === id);
            if (i.checked !== want) i.click();
          });
        // NPCs
        document.querySelectorAll(
          `${npcHostileListSelector} input[data-npc-id],${npcFriendlyListSelector} input[data-npc-id]`
        ).forEach(i => {
          const want = (type === "NPC" && i.dataset.npcId === id);
          if (i.checked !== want) i.click();
        });
      });
    });
  }

  // Live-search handler
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
