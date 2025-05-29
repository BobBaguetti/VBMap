// @file: src/modules/sidebar/search.js
// @version: 1.1 — add floating search suggestions UI

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize the search bar styling, clear-button behavior, and floating suggestions.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector    – selector for the search input
 * @param {string} params.clearButtonSelector – selector for the clear button
 */
export function setupSidebarSearch({
  searchBarSelector   = "#search-bar",
  clearButtonSelector = "#search-clear"
}) {
  const searchBar = document.querySelector(searchBarSelector);
  const clearBtn  = document.querySelector(clearButtonSelector);
  if (!searchBar || !clearBtn) {
    console.warn("[sidebarSearch] Missing elements");
    return;
  }

  // style and clear handler
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // ≡ Suggestions UI
  const wrapper = searchBar.closest(".search-wrapper");
  if (!wrapper) {
    console.warn("[sidebarSearch] .search-wrapper not found");
    return;
  }

  // create (or reuse) the suggestions container
  let resultsEl = wrapper.querySelector(".search-results");
  if (!resultsEl) {
    resultsEl = document.createElement("ul");
    resultsEl.classList.add("search-results");
    wrapper.appendChild(resultsEl);
  }
  resultsEl.style.display = "none";

  // handle input events
  const handleInput = () => {
    const q = searchBar.value.trim().toLowerCase();
    if (q.length < 2) {
      resultsEl.style.display = "none";
      resultsEl.innerHTML = "";
      return;
    }

    // get all item definitions and filter by name
    const items = Object.values(definitionsManager.getItemDefMap());
    const matches = items
      .filter(def => def.name.toLowerCase().includes(q))
      .slice(0, 10);

    resultsEl.innerHTML = "";
    for (const def of matches) {
      const li = document.createElement("li");
      li.classList.add("search-result-item");
      li.tabIndex = 0;
      li.textContent = def.name;
      li.addEventListener("click", () => {
        console.log(`Clicked suggestion: ${def.name} (id: ${def.id})`);
        // TODO: wire “filter by” / “hide all” actions here
      });
      resultsEl.appendChild(li);
    }

    if (matches.length) {
      resultsEl.style.display = "block";
    } else {
      resultsEl.style.display = "none";
    }
  };

  searchBar.addEventListener("input", handleInput);

  // clicking outside closes the suggestions
  document.addEventListener("click", e => {
    if (!wrapper.contains(e.target)) {
      resultsEl.style.display = "none";
    }
  });
}
