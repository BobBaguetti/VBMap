// @file: src/modules/sidebar/search.js
// @version: 2.9 — clear search input on action so name filtering no longer interferes

import definitionsManager from "../../bootstrap/definitionsManager.js";

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

  function getFilterInput(id) {
    return document.querySelector(
      `#item-filter-list input[data-item-id="${id}"]`
    );
  }

  function clearSearch() {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
  }

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

      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        if (input) input.click();
        clearSearch();
      });

      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        document
          .querySelectorAll("#item-filter-list input[data-item-id]")
          .forEach(i => {
            if (i.dataset.itemId !== id && i.checked) i.click();
          });
        if (input && !input.checked) input.click();
        clearSearch();
      });

      item.querySelector(".hide-all-btn")?.addEventListener("click", () => {
        if (input && input.checked) input.click();
        clearSearch();
      });
    });
  }

  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }
    const defs = Object.values(definitionsManager.getItemDefMap());
    const matches = defs.filter(d =>
      d.name?.toLowerCase().includes(q)
    ).slice(0, 10);

    if (matches.length) {
      renderSuggestions(matches);
      suggestionsList.classList.add("visible");
    } else {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
    }
  });
}
