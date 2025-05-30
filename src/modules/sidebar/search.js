// @file: src/modules/sidebar/search.js
// @version: 2.6 — add Filter By / Hide All callbacks

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize the search bar styling, clear-button behavior, and live search suggestions.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector
 * @param {string} params.clearButtonSelector
 * @param {string} params.suggestionsListSelector
 * @param {(id:string)=>void} [params.onFilterBy]
 * @param {(id:string)=>void} [params.onHideAll]
 */
export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions",
  onFilterBy,
  onHideAll
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

  // Ensure wrapper is a positioning context
  const searchWrapper = searchBar.parentNode;
  if (getComputedStyle(searchWrapper).position === "static") {
    searchWrapper.style.position = "relative";
  }

  // Create or select the suggestions list
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    searchWrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // Render suggestions with action buttons
  function renderSuggestions(matches) {
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");

    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      const id = item.dataset.id;
      const filterBtn = item.querySelector(".filter-by");
      const hideBtn   = item.querySelector(".hide-all");
      if (filterBtn && onFilterBy) {
        filterBtn.addEventListener("click", () => onFilterBy(id));
      }
      if (hideBtn && onHideAll) {
        hideBtn.addEventListener("click", () => onHideAll(id));
      }
    });
  }

  // Listen for input to filter definitions and show/hide dropdown
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.trim().toLowerCase();
    if (!query) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }
    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs
      .filter(d => d.name?.toLowerCase().includes(query))
      .slice(0, 10);

    if (matches.length === 0) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
    } else {
      renderSuggestions(matches);
      suggestionsList.classList.add("visible");
    }
  });
}
