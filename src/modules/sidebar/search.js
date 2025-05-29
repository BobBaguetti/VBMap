// @file: src/modules/sidebar/search.js
// @version: 2.0 — added live search suggestions

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize the search bar styling, clear-button behavior, and live search suggestions.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector        – selector for the search input
 * @param {string} params.clearButtonSelector     – selector for the clear button
 * @param {string} params.suggestionsListSelector – selector for the suggestions container
 */
export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions"
}) {
  const searchBar = document.querySelector(searchBarSelector);
  const clearBtn  = document.querySelector(clearButtonSelector);
  if (!searchBar || !clearBtn) {
    console.warn("[sidebarSearch] Missing elements");
    return;
  }

  // Style and clear handler
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Create suggestions <ul> if it doesn't exist
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.replace("#", "");
    suggestionsList.classList.add("search-suggestions");
    // append under the search-wrapper
    clearBtn.parentNode.appendChild(suggestionsList);
  }

  // Listen for input events and update suggestions
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.trim().toLowerCase();
    // Clear if empty
    if (!query) {
      suggestionsList.innerHTML = "";
      return;
    }

    // Pull item definitions and filter by name
    const defsMap = definitionsManager.getItemDefMap();
    const defs = Object.values(defsMap);
    const matches = defs
      .filter(def => def.name && def.name.toLowerCase().includes(query))
      .slice(0, 10);

    // Render suggestion items
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");
  });
}
