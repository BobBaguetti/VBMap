// @file: src/modules/sidebar/search.js
// @version: 2.4 — hide suggestions panel when no results, avoiding reserved space

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

  // Ensure the wrapper is a positioning context
  const searchWrapper = searchBar.parentNode;
  if (getComputedStyle(searchWrapper).position === "static") {
    searchWrapper.style.position = "relative";
  }

  // Build suggestions <ul> if missing, and append inside the wrapper
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    searchWrapper.appendChild(suggestionsList);
  }

  // Hide suggestions panel initially
  suggestionsList.style.display = "none";

  // Handle input events to show/hide and render suggestions
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.trim().toLowerCase();

    // No query → clear and hide
    if (!query) {
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";
      return;
    }

    // Filter definitions
    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs.filter(def =>
      def.name?.toLowerCase().includes(query)
    ).slice(0, 10);

    // No matches → clear and hide
    if (matches.length === 0) {
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";
      return;
    }

    // Render matches and show panel
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");
    suggestionsList.style.display = "block";
  });
}
