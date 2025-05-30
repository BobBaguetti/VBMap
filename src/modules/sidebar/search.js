// @file: src/modules/sidebar/search.js
// @version: 3.1.2 — Smart “Show Only”: chest size vs category, per-type isolation

import definitionsManager from "../../bootstrap/definitionsManager.js";

/**
 * Initialize search suggestions that drive the sidebar’s filters.
 *
 * @param {object} params
 * @param {string} params.searchBarSelector
 * @param {string} params.clearButtonSelector
 * @param {string} params.suggestionsListSelector
 * @param {string} params.mainFiltersSelector
 * @param {string} params.itemFilterListSelector
 * @param {string} params.chestFilterListSelector
 * @param {string} params.npcHostileListSelector
 * @param {string} params.npcFriendlyListSelector
 */
export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions",
  mainFiltersSelector     = "#main-filters .toggle-group",
  itemFilterListSelector  = "#item-filter-list",
  chestFilterListSelector = "#chest-filter-list",
  npcHostileListSelector  = "#npc-hostile-list",
  npcFriendlyListSelector = "#npc-friendly-list"
}) {
  const searchBar = document.querySelector(searchBarSelector);
  const clearBtn  = document.querySelector(clearButtonSelector);
  if (!searchBar || !clearBtn) {
    console.warn("[sidebarSearch] Missing elements");
    return;
  }

  // Clear button (does not hide dropdown)
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // Ensure wrapper is positioned
  const wrapper = searchBar.parentNode;
  if (getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }

  // Suggestions container
  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    wrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  // Helpers to locate each filter toggle in the sidebar
  const getItemInput = id =>
    document.querySelector(
      `${itemFilterListSelector} input[data-item-id="${id}"]`
    );
  const getChestInput = key =>
    document.querySelector(
      `${chestFilterListSelector} input[data-chest-filter="size"][data-chest-size="${key}"],` +
      `${chestFilterListSelector} input[data-chest-filter="category"][data-chest-category="${key}"]`
    );
  const getNpcInput = id =>
    document.querySelector(
      `${npcHostileListSelector} input[data-npc-id="${id}"],` +
      `${npcFriendlyListSelector} input[data-npc-id="${id}"]`
    );

  // Build a unified list of search entries
  function loadAllDefinitions() {
    // Items & NPCs from definitions
    const items = Object.values(definitionsManager.getDefinitions("Item"))
      .map(d => ({ id: d.id, name: d.name, type: "Item" }));
    const npcs = Object.values(definitionsManager.getDefinitions("NPC"))
      .map(d => ({ id: d.id, name: d.name, type: "NPC" }));

    // Chest entries in desired order
    const chestKeys = [
      { id: "Small",       name: "Small Chest" },
      { id: "Medium",      name: "Medium Chest" },
      { id: "Large",       name: "Large Chest" },
      { id: "Normal",      name: "Normal Chest" },
      { id: "Dragonvault", name: "Dragonvault Chest" }
    ].map(o => ({ ...o, type: "Chest" }));

    return [...items, ...chestKeys, ...npcs];
  }

  // Render the Toggle & Show Only buttons
  function renderSuggestions(matches) {
    suggestionsList.innerHTML = matches.map(def => `
      <li class="search-suggestion-item" data-id="${def.id}" data-type="${def.type}">
        <span class="suggestion-name">${def.name}</span>
        <button class="suggestion-action toggle-btn">Toggle</button>
        <button class="suggestion-action show-only-btn">Show Only</button>
      </li>
    `).join("");

    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      const id   = item.dataset.id;
      const type = item.dataset.type;
      let input;

      if (type === "Item")  input = getItemInput(id);
      if (type === "Chest") input = getChestInput(id);
      if (type === "NPC")   input = getNpcInput(id);

      // Toggle this filter on/off
      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        if (input) input.click();
      });

      // Show only this filter: isolate within its type
      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        // 1) Main-layer: only the clicked type remains checked
        document.querySelectorAll(`${mainFiltersSelector} input[data-layer]`)
          .forEach(i => {
            const want = (i.dataset.layer === type);
            if (i.checked !== want) i.click();
          });

        // 2) Items: if not an Item search, uncheck all; otherwise keep only target
        if (type === "Item") {
          document.querySelectorAll(`${itemFilterListSelector} input[data-item-id]`)
            .forEach(i => {
              const keep = (i.dataset.itemId === id);
              if (i.checked !== keep) i.click();
            });
        } else {
          document.querySelectorAll(`${itemFilterListSelector} input[data-item-id]`)
            .forEach(i => { if (i.checked) i.click(); });
        }

        // 3) Chests: handle size vs category group
        if (type === "Chest") {
          const isSize     = ["Small","Medium","Large"].includes(id);
          const filterType = isSize ? "size" : "category";
          // Toggle others of same filterType off, keep this one on
          document.querySelectorAll(
            `${chestFilterListSelector} input[data-chest-filter="${filterType}"]`
          ).forEach(i => {
            const key = filterType === "size" ? i.dataset.chestSize : i.dataset.chestCategory;
            const keep = (key === id);
            if (i.checked !== keep) i.click();
          });
        } else {
          // Uncheck all chest filters if not searching chests
          document.querySelectorAll(`${chestFilterListSelector} input`)
            .forEach(i => { if (i.checked) i.click(); });
        }

        // 4) NPCs: isolate or clear
        if (type === "NPC") {
          document.querySelectorAll(
            `${npcHostileListSelector} input[data-npc-id],${npcFriendlyListSelector} input[data-npc-id]`
          ).forEach(i => {
            const keep = (i.dataset.npcId === id);
            if (i.checked !== keep) i.click();
          });
        } else {
          document.querySelectorAll(
            `${npcHostileListSelector} input[data-npc-id],${npcFriendlyListSelector} input[data-npc-id]`
          ).forEach(i => { if (i.checked) i.click(); });
        }
      });
    });
  }

  // Live-search handler
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.remove("visible");
      return;
    }

    const allDefs = loadAllDefinitions();
    const matches = allDefs
      .filter(d => d.name.toLowerCase().includes(q))
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
