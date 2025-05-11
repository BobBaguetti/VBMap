// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.13 — remove loadAllDefinitions, use allMarkers for search

import { setupSidebarFilters } from "./sidebarFilters.js";

/**
 * Wire up sidebar UI:
 *  - Search‐bar styling, clear button, and live dropdown
 *  - Sidebar open/close toggle
 *  - Per‐group collapse/expand with animation
 *  - “Eye” bulk‐toggle icons
 *  - Filters “Toggle All” and master collapse/expand button
 *
 * @param {{ map: L.Map, sidebarSelector?: string, toggleSelector?: string, searchBarSelector?: string, resultsSelector?: string, filterGroupSelector?: string, layers: object, allMarkers: Array, db: Firestore }} opts
 */
export async function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  resultsSelector     = "#search-results",
  filterGroupSelector = ".filter-group",
  layers,
  allMarkers,
  db
}) {
  const sidebar       = document.querySelector(sidebarSelector);
  const sidebarToggle = document.querySelector(toggleSelector);
  const searchBar     = document.querySelector(searchBarSelector);
  const clearBtn      = document.getElementById("search-clear");
  const resultsBox    = document.querySelector(resultsSelector);

  if (!sidebar || !sidebarToggle || !searchBar || !clearBtn || !resultsBox) {
    console.warn("[sidebarUI] Missing elements");
    return;
  }

  // 1) Initialize sidebar filters
  const { filterMarkers, loadItemFilters } = setupSidebarFilters({
    searchBarSelector,
    mainFiltersSelector: "#main-filters .toggle-group",
    pveToggleSelector: "#toggle-pve",
    itemFilterListSelector: "#item-filter-list",
    chestFilterListSelector: "#chest-filter-list",
    npcFilterListSelector: "#npc-hostile-list",
    layers,
    allMarkers,
    db
  });
  await loadItemFilters();

  // 2) Clear-button
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input"));
    searchBar.focus();
  });

  // 3) Live-search dropdown
  // Build a deduplicated list of { name, type } for search suggestions
  const definitions = Array.from(
    new Map(allMarkers.map(({ data }) => [data.name, { name: data.name, type: data.type }])).values()
  );

  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    resultsBox.innerHTML = "";
    if (!q) return;

    const matches = definitions
      .filter(def => def.name.toLowerCase().includes(q))
      .slice(0, 10);

    matches.forEach(def => {
      const row = document.createElement("div");
      row.className = "result-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "result-name";
      nameSpan.textContent = def.name;

      const actions = document.createElement("div");
      actions.className = "result-actions";

      // Show Only button
      const btnShow = document.createElement("button");
      btnShow.title = "Show only this";
      btnShow.innerHTML = '<i class="fas fa-eye"></i>';
      btnShow.addEventListener("click", e => {
        e.stopPropagation();
        // clear all, then show only this
        Object.values(layers).forEach(g => g.clearLayers());
        allMarkers.forEach(({ markerObj, data }) => {
          if (data.name === def.name) layers[data.type].addLayer(markerObj);
        });
        resultsBox.innerHTML = "";
      });

      // Exclude button
      const btnExcl = document.createElement("button");
      btnExcl.title = "Exclude this";
      btnExcl.innerHTML = '<i class="fas fa-eye-slash"></i>';
      btnExcl.addEventListener("click", e => {
        e.stopPropagation();
        allMarkers.forEach(({ markerObj, data }) => {
          if (data.name === def.name) layers[data.type].removeLayer(markerObj);
        });
        resultsBox.innerHTML = "";
      });

      actions.append(btnShow, btnExcl);
      row.append(nameSpan, actions);
      resultsBox.appendChild(row);
    });
  });

  document.addEventListener("click", e => {
    if (!sidebar.contains(e.target)) {
      resultsBox.innerHTML = "";
    }
  });

  // 4) Sidebar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // 5) Collapse/expand groups
  function animateToggle(group) {
    const container = group.querySelector(".toggle-group");
    if (!container) return;
    const isCollapsed = group.classList.contains("collapsed");
    container.removeEventListener("transitionend", onTransitionEnd);

    if (isCollapsed) container.style.visibility = "visible";
    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight;
    container.style.transition = "max-height 0.3s ease-in-out";

    if (isCollapsed) {
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
    }

    function onTransitionEnd(e) {
      if (e.propertyName === "max-height" && group.classList.contains("collapsed")) {
        container.style.visibility = "hidden";
      }
    }
    container.addEventListener("transitionend", onTransitionEnd);
  }

  // 6) Per-group collapse & eye
  let updateMasterCollapseIcon = () => {};
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;
    header.addEventListener("click", () => {
      animateToggle(group);
      updateMasterCollapseIcon();
    });
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = [...inputs].some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);
      updateMasterCollapseIcon();
    });
  });

  // 7) Master Filter controls
  const filtersHeader = document.querySelector('#filters-section > h2');
  if (filtersHeader) {
    const toggleAllLink = document.createElement('a');
    toggleAllLink.textContent = 'Toggle All';
    toggleAllLink.classList.add('toggle-all');
    toggleAllLink.style.marginLeft = '1em';
    toggleAllLink.style.cursor     = 'pointer';
    filtersHeader.appendChild(toggleAllLink);
    toggleAllLink.addEventListener('click', e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    const collapseBtn = document.createElement('i');
    collapseBtn.classList.add('fas', 'collapse-all', 'fa-chevron-right');
    collapseBtn.style.position   = 'absolute';
    collapseBtn.style.right      = '0.6em';
    collapseBtn.style.top        = '50%';
    collapseBtn.style.transform  = 'translateY(-50%)';
    collapseBtn.style.cursor     = 'pointer';
    collapseBtn.style.transition = 'color 0.2s';
    filtersHeader.appendChild(collapseBtn);

    const getSubGroups = () =>
      Array.from(document.querySelectorAll('#filters-section > .filter-group'));

    updateMasterCollapseIcon = () => {
      const allCollapsed = getSubGroups().every(g => g.classList.contains('collapsed'));
      collapseBtn.classList.replace(
        allCollapsed ? 'fa-chevron-down' : 'fa-chevron-right',
        allCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'
      );
    };

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      const groups      = getSubGroups();
      const allCollapsed = groups.every(g => g.classList.contains('collapsed'));
      groups.forEach(g => {
        const shouldCollapse = !allCollapsed;
        if (g.classList.contains('collapsed') === shouldCollapse) return;
        animateToggle(g);
      });
      updateMasterCollapseIcon();
    });

    updateMasterCollapseIcon();
  }
}
