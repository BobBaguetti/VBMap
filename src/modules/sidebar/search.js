// @file: src/modules/sidebar/search.js
// @version: 2.2 — floating suggestion list outside sidebar

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

  // Keep original styling & clear behavior
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  const searchWrapper = searchBar.parentNode;

  // Create or reuse floating <ul> in the body
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    // float above everything
    suggestionsList.style.position = "absolute";
    suggestionsList.style.zIndex    = "2000";
    suggestionsList.style.boxSizing = "border-box";
    suggestionsList.style.maxHeight = "200px";
    suggestionsList.style.overflowY = "auto";

    document.body.appendChild(suggestionsList);

    // Reposition on scroll/resize/input
    const reposition = () => {
      const rect = searchWrapper.getBoundingClientRect();
      suggestionsList.style.width = `${rect.width}px`;
      suggestionsList.style.left  = `${rect.left}px`;
      suggestionsList.style.top   = `${rect.bottom + window.scrollY}px`;
    };
    window.addEventListener("scroll",  reposition, { passive: true });
    window.addEventListener("resize",  reposition);
    searchBar.addEventListener("input", reposition);
  }

  // Render matches on each keystroke
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      return;
    }

    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs
      .filter(d => d.name && d.name.toLowerCase().includes(q))
      .slice(0, 10);

    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action filter-by">Filter By</button>
        <button class="suggestion-action hide-all">Hide All</button>
      </li>
    `).join("");
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", e => {
    if (!searchWrapper.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = "";
    }
  });
}
