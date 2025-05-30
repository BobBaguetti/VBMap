// @file: src/modules/sidebar/search.js
// @version: 1.2 — float suggestions outside sidebar to avoid layout shift

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

  // Style & clear handler
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Create (or reuse) the floating suggestions container
  let resultsEl = document.querySelector(".search-results");
  if (!resultsEl) {
    resultsEl = document.createElement("ul");
    resultsEl.classList.add("search-results");
    resultsEl.setAttribute("role", "listbox");
    // start hidden
    resultsEl.style.display = "none";
    document.body.appendChild(resultsEl);
  }

  // Positioning helper
  function updateResultsPosition() {
    const rect = searchBar.getBoundingClientRect();
    resultsEl.style.top  = `${rect.bottom + window.scrollY + 4}px`;
    resultsEl.style.left = `${rect.left + window.scrollX}px`;
    resultsEl.style.width = `${rect.width}px`;
  }

  // Render suggestions on input
  function handleInput() {
    const q = searchBar.value.trim().toLowerCase();
    if (q.length < 2) {
      resultsEl.style.display = "none";
      resultsEl.innerHTML = "";
      return;
    }

    // Re-position before drawing
    updateResultsPosition();

    // Filter definitions by name
    const items = Object.values(definitionsManager.getItemDefMap());
    const matches = items
      .filter(def => def.name.toLowerCase().includes(q))
      .slice(0, 10);

    // Build list
    resultsEl.innerHTML = "";
    for (const def of matches) {
      const li = document.createElement("li");
      li.classList.add("search-result-item");
      li.tabIndex = 0;
      li.setAttribute("role", "option");
      li.textContent = def.name;
      li.addEventListener("click", () => {
        // TODO: wire “filter by” / “hide all” actions here
        console.log("Clicked suggestion:", def);
      });
      resultsEl.appendChild(li);
    }

    resultsEl.style.display = matches.length ? "block" : "none";
  }

  searchBar.addEventListener("input", handleInput);
  window.addEventListener("resize", updateResultsPosition);
  window.addEventListener("scroll", updateResultsPosition, true);

  // Close when clicking outside searchBar or resultsEl
  document.addEventListener("click", e => {
    if (
      e.target !== searchBar &&
      e.target !== clearBtn &&
      !resultsEl.contains(e.target)
    ) {
      resultsEl.style.display = "none";
    }
  });
}
