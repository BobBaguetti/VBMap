// @file: src/modules/sidebar/search.js
// @version: 1.0 — extracted search bar setup from sidebarUI.js

/**
 * Initialize the search bar styling and clear-button behavior.
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
}
