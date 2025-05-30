// @file: src/modules/sidebar/search.js
// @version: 2.3 — render suggestions as an absolute dropdown inside the wrapper

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

  // style + clear logic
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // ensure the wrapper is a positioning context
  const searchWrapper = searchBar.parentNode;
  if (getComputedStyle(searchWrapper).position === "static") {
    searchWrapper.style.position = "relative";
  }

  // build or re-use the suggestions <ul>, appended inside the wrapper
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    searchWrapper.appendChild(suggestionsList);
  }

  // render matches on each input
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      return;
    }

    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs
      .filter(d => d.name?.toLowerCase().includes(q))
      .slice(0, 10);

    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");
  });
}
