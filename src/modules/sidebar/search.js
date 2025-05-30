// @file: src/modules/sidebar/search.js
// @version: 4.0 — leverage shared filterActions for Toggle & Show Only

import definitionsManager from "../../bootstrap/definitionsManager.js";
import { toggleFilter, showOnlyFilter } from "./filterActions.js";

export function setupSidebarSearch({
  searchBarSelector       = "#search-bar",
  clearButtonSelector     = "#search-clear",
  suggestionsListSelector = "#search-suggestions"
}) {
  const searchBar = document.querySelector(searchBarSelector);
  const clearBtn  = document.querySelector(clearButtonSelector);
  if (!searchBar || !clearBtn) return;

  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  const wrapper = searchBar.parentNode;
  if (getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }

  let suggestionsList = document.querySelector(suggestionsListSelector);
  if (!suggestionsList) {
    suggestionsList = document.createElement("ul");
    suggestionsList.id = suggestionsListSelector.slice(1);
    suggestionsList.classList.add("search-suggestions");
    wrapper.appendChild(suggestionsList);
  }
  suggestionsList.classList.remove("visible");

  function loadAllDefinitions() {
    const items = Object.values(definitionsManager.getDefinitions("Item"))
      .map(d => ({ id: d.id, name: d.name, type: "Item" }));
    const npcs = Object.values(definitionsManager.getDefinitions("NPC"))
      .map(d => ({ id: d.id, name: d.name, type: "NPC" }));
    const chestKeys = [
      { id: "Small",       name: "Small Chest" },
      { id: "Medium",      name: "Medium Chest" },
      { id: "Large",       name: "Large Chest" },
      { id: "Normal",      name: "Normal Chest" },
      { id: "Dragonvault", name: "Dragonvault Chest" }
    ].map(o => ({ ...o, type: "Chest" }));
    return [...items, ...chestKeys, ...npcs];
  }

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

      item.querySelector(".toggle-btn")?.addEventListener("click", () => {
        toggleFilter(type, id);
      });

      item.querySelector(".show-only-btn")?.addEventListener("click", () => {
        showOnlyFilter(type, id);
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
