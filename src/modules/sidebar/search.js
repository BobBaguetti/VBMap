// @file: src/modules/sidebar/search.js
// @version: 2.2 — move suggestions outside overflow:hidden, add debug logs

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize the search bar styling, clear-button behavior, and live search suggestions.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector        – selector for the search input
 * @param {string} params.clearButtonSelector      – selector for the clear button
 * @param {string} params.suggestionsListSelector  – selector for the suggestions container
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

  // style + clear handler
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // build the <ul> if it doesn't exist
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    // insert it *after* the sidebar-search container itself
    const sidebarSearch = document.getElementById("sidebar-search");
    sidebarSearch.insertAdjacentElement("afterend", suggestionsList);
    console.log("[sidebarSearch] created suggestionsList");
  }

  // on each keystroke, filter and render up to 10 matches
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    console.log("[sidebarSearch] input:", q);
    if (!q) {
      suggestionsList.innerHTML = "";
      return;
    }

    // grab all Item defs
    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs
      .filter(d => d.name?.toLowerCase().includes(q))
      .slice(0, 10);

    console.log("[sidebarSearch] matches:", matches.map(d => d.name));

    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");
  });
}
