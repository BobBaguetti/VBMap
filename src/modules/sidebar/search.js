// @file: src/modules/sidebar/search.js
// @version: 2.8.1 — fix selectors for item filters and Show Only behavior

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize the search bar, clear-button, and live search suggestions that
 * manipulate the sidebar’s item filter checkboxes.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector
 * @param {string} params.clearButtonSelector
 * @param {string} params.suggestionsListSelector
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

  // Clear-button behavior
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Positioning context
  const searchWrapper = searchBar.parentNode;
  if (getComputedStyle(searchWrapper).position === "static") {
    searchWrapper.style.position = "relative";
  }

  // Suggestions <ul>
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    searchWrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // Helper: find the item-filter checkbox by data-item-id
  function getFilterInput(id) {
    return document.querySelector(
      `#item-filter-list input[data-item-id="${id}"]`
    );
  }

  // Render suggestion cards with three actions
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
      const input = getFilterInput(id);
      const toggleBtn   = item.querySelector(".toggle-btn");
      const showOnlyBtn = item.querySelector(".show-only-btn");
      const hideAllBtn  = item.querySelector(".hide-all-btn");

      // Toggle this filter on/off
      toggleBtn?.addEventListener("click", () => {
        if (input) input.click();
      });

      // Show only this filter: turn off all others, then turn on this one
      showOnlyBtn?.addEventListener("click", () => {
        document
          .querySelectorAll("#item-filter-list input[data-item-id]")
          .forEach(i => {
            if (i.dataset.itemId !== id && i.checked) {
              i.click();
            }
          });
        if (input && !input.checked) {
          input.click();
        }
      });

      // Hide all of this type
      hideAllBtn?.addEventListener("click", () => {
        if (input && input.checked) {
          input.click();
        }
      });
    });
  }

  // Live search logic
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }

    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs
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
