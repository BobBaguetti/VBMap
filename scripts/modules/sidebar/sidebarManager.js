// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 5   The current file version is 5. Increase by 1 every time you update anything.
// @file:    /scripts/modules/sidebar/sidebarManager.js

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";
import { loadNpcDefinitions }  from "../services/npcDefinitionsService.js";
import { initTestItemDefinitionsModal } from "../ui/modals/testItemDefinitionsModal.js";
import { initNpcDefinitionsModal }      from "../ui/modals/npcDefinitionsModal.js";

export async function setupSidebar(map, layers, allMarkers, db) {
  const searchBar       = document.getElementById("search-bar");
  const sidebarToggle   = document.getElementById("sidebar-toggle");
  const sidebar         = document.getElementById("sidebar");
  const mapContainer    = document.getElementById("map");
  const enableGroupingCb = document.getElementById("enable-grouping");

  if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
    console.warn("[sidebarManager] Missing elements");
    return { filterMarkers() {} };
  }

  // Dark-style the search input
  searchBar.classList.add("ui-input");

  // Initialize side‐bar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Accordion behavior
  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
  });

  // PvE master toggle (in Main filters)
  const mainToggleGroup = document.querySelector("#main-filters .toggle-group");
  const pveLabel = document.createElement("label");
  pveLabel.innerHTML = `<input type="checkbox" id="toggle-pve" checked> PvE`;
  mainToggleGroup.appendChild(pveLabel);
  const pveToggle = document.getElementById("toggle-pve");

  // Core filter logic
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = pveToggle.checked;

    allMarkers.forEach(({ markerObj, data }) => {
      const isNpc      = data.type === "npc";
      const matchesPvE = pveOn || !isNpc;               // if PvE off, hide all NPCs
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // main‐filter checkboxes
      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input")
        .forEach(cb => {
          if (data.type === cb.dataset.layer && !cb.checked) {
            mainVisible = false;
          }
        });

      // item‐filter checkboxes
      let itemVisible = true;
      if (data.predefinedItemId) {
        const itemCb = document.querySelector(
          `#item-filter-list input[data-item-id="${data.predefinedItemId}"]`
        );
        if (itemCb && !itemCb.checked) itemVisible = false;
      }

      const shouldShow = matchesPvE && matchesName && mainVisible && itemVisible;
      const layerGroup = layers[data.type];
      if (!layerGroup) return;

      if (shouldShow) layerGroup.addLayer(markerObj);
      else            layerGroup.removeLayer(markerObj);
    });
  }

  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  pveToggle.addEventListener("change", filterMarkers);

  // Populate ITEM filters
  const itemFilterList = document.getElementById("item-filter-list");
  async function loadItemFilters() {
    itemFilterList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const label = document.createElement("label");
      const cb    = document.createElement("input");
      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.itemId = d.id;
      label.append(cb, ` ${d.name}`);
      itemFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadItemFilters();

  // Populate ENEMY filters
  const enemyGroupWrap = document.createElement("div");
  enemyGroupWrap.className = "filter-group";
  enemyGroupWrap.innerHTML = `<h3>Enemies</h3>
    <div class="toggle-group" id="enemy-filter-list"></div>`;
  sidebar.querySelector("#item-filter-list").closest(".filter-group").after(enemyGroupWrap);

  const enemyFilterList = document.getElementById("enemy-filter-list");
  async function loadEnemyFilters() {
    enemyFilterList.innerHTML = "";
    const npcs = await loadNpcDefinitions(db);
    npcs.forEach(d => {
      const label = document.createElement("label");
      const cb    = document.createElement("input");
      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.enemyId = d.id;
      label.append(cb, ` ${d.name}`);
      enemyFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadEnemyFilters();

  // Add “Admin Tools” buttons
  const testItemModal = initTestItemDefinitionsModal(db);
  const btns = [
    ["Manage Items",   () => testItemModal.open()],
    ["Manage Quests",  () => {/* your quest modal */}],
    ["Test Item Modal",() => testItemModal.open()],
    ["Manage NPCs",    () => initNpcDefinitionsModal(db).open()]
  ];
  const adminWrap = document.createElement("div");
  adminWrap.id = "sidebar-admin-tools";
  btns.forEach(([txt, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = txt;
    btn.onclick = fn;
    adminWrap.appendChild(btn);
  });
  sidebar.appendChild(adminWrap);

  return { filterMarkers, loadItemFilters, loadEnemyFilters };
}
