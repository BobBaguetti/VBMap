// @file: src/modules/sidebar/search.js
// @version: 2.10 — correct Show Only across all categories & keep dropdown open

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize search suggestions that drive the sidebar’s filters.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector
 * @param {string} params.clearButtonSelector
 * @param {string} params.suggestionsListSelector
 * @param {string} params.mainFiltersSelector      – selector for the main-layer toggles
 * @param {string} params.chestFilterListSelector  – selector for chest filters container
 * @param {string} params.npcHostileListSelector   – selector for hostile-NPC filters
 * @param {string} params.npcFriendlyListSelector  – selector for friendly-NPC filters
 */
export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions",
  mainFiltersSelector     = "#main-filters .toggle-group",
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

  // Clear button (just empties input, doesn’t hide dropdown)
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

  // Suggestions list
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    wrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // Helpers to find filter inputs
  const getItemInput    = id => document.querySelector(
    `#item-filter-list input[data-item-id="${id}"]`
  );
  const getMainInputs   = () => document.querySelectorAll(
    `${mainFiltersSelector} input[data-layer]`
  );
  const getChestInputs  = () => document.querySelectorAll(
    `${chestFilterListSelector} input`
  );
  const getNpcInputs    = () => document.querySelectorAll(
    `${npcHostileListSelector} input,${npcFriendlyListSelector} input`
  );

  function renderSuggestions(matches) {
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action toggle-btn">Toggle</button>
        <button class="suggestion-action show-only-btn">Show Only</button>
        <button class="suggestion-action hide-all-btn">Hide All</button>
      </li>
    `).join("");

    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      const id = item.dataset.id;
      const itemInput = getItemInput(id);

      // Toggle just this item filter
      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        if (itemInput) itemInput.click();
      });

      // Show Only this item: uncheck everything else
      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        // 1) Main-layer: only keep “Item” on
        getMainInputs().forEach(i => {
          if (i.dataset.layer !== "Item" && i.checked) i.click();
        });
        // 2) Chest filters: uncheck all
        getChestInputs().forEach(i => { if (i.checked) i.click(); });
        // 3) NPC filters: uncheck all
        getNpcInputs().forEach(i => { if (i.checked) i.click(); });
        // 4) Ensure this item is checked
        if (itemInput && !itemInput.checked) itemInput.click();
      });

      // Hide All of this item: just uncheck this one
      item.querySelector(".hide-all-btn")?.addEventListener("click", () => {
        if (itemInput && itemInput.checked) itemInput.click();
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
    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs.filter(d => d.name?.toLowerCase().includes(q)).slice(0, 10);

    if (matches.length) {
      renderSuggestions(matches);
      suggestionsList.classList.add("visible");
    } else {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
    }
  });
}
