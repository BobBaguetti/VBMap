// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 9   Increase by 1 every time you update anything.
// @file:    /scripts/modules/sidebar/sidebarManager.js

import { loadItemDefinitions }       from "../services/itemDefinitionsService.js";
import { loadNpcDefinitions }        from "../services/npcDefinitionsService.js";
import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";        // old modal
import { initTestItemDefinitionsModal } from "../ui/modals/testItemDefinitionsModal.js"; // test modal
import { initQuestDefinitionsModal } from "../ui/modals/questDefinitionsModal.js";
import { initNpcDefinitionsModal }   from "../ui/modals/npcDefinitionsModal.js";

export async function setupSidebar(map, layers, allMarkers, db) {
  console.debug("[sidebar] setupSidebar() start", { map, layers, markerCount: allMarkers.length });

  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const mapContainer  = document.getElementById("map");

  console.debug("[sidebar] Elements:", {
    searchBar: !!searchBar,
    sidebarToggle: !!sidebarToggle,
    sidebar: !!sidebar,
    mapContainer: !!mapContainer
  });

  if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
    console.warn("[sidebar] Missing elements, aborting setup");
    return { filterMarkers() {} };
  }

  // Dark-style the search input
  searchBar.classList.add("ui-input");
  console.debug("[sidebar] Applied dark styling to searchBar, classes:", searchBar.className);

  // Sidebar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
    console.debug("[sidebar] Toggled sidebar visibility:", hidden);
  });

  // Accordion behavior
  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.debug("[sidebar] Accordion toggle:", header.textContent.trim(), "collapsed=", group.classList.contains("collapsed"));
    });
  });

  // PvE master toggle
  const mainToggleGroup = document.querySelector("#main-filters .toggle-group");
  const pveLabel = document.createElement("label");
  pveLabel.innerHTML = `<input type="checkbox" id="toggle-pve" checked> PvE`;
  mainToggleGroup.appendChild(pveLabel);
  const pveToggle = document.getElementById("toggle-pve");
  console.debug("[sidebar] Added PvE master toggle");

  // Core filtering
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = pveToggle.checked;
    console.debug("[sidebar] filterMarkers() fired", { nameQuery, pveOn });

    allMarkers.forEach(({ markerObj, data }) => {
      const isNpc       = data.type === "npc";
      const matchesPvE  = pveOn || !isNpc;
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input").forEach(cb => {
        if (data.type === cb.dataset.layer && !cb.checked) mainVisible = false;
      });

      let itemVisible = true;
      if (data.predefinedItemId) {
        const itemCb = document.querySelector(
          `#item-filter-list input[data-item-id="${data.predefinedItemId}"]`
        );
        if (itemCb && !itemCb.checked) itemVisible = false;
      }

      let enemyVisible = true;
      if (isNpc) {
        const enemyCb = document.querySelector(
          `#enemy-filter-list input[data-enemy-id="${data.id}"]`
        );
        if (enemyCb && !enemyCb.checked) enemyVisible = false;
      }

      const shouldShow = matchesPvE
                       && matchesName
                       && mainVisible
                       && (isNpc ? enemyVisible : itemVisible);

      const layerGroup = layers[data.type];
      if (!layerGroup) return;

      if (shouldShow) {
        layerGroup.addLayer(markerObj);
      } else {
        layerGroup.removeLayer(markerObj);
      }
    });
  }

  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  pveToggle.addEventListener("change", filterMarkers);

  // — Items —
  const itemFilterList = document.getElementById("item-filter-list");
  async function loadItemFilters() {
    const list = await loadItemDefinitions(db);
    console.debug("[sidebar] loadItemFilters() fetched", list.length, "definitions");
    itemFilterList.innerHTML = "";
    list.filter(d => d.showInFilters).forEach(d => {
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

  // — Enemies —
  const itemGroup       = itemFilterList.closest(".filter-group");
  const enemyGroupWrap  = document.createElement("div");
  enemyGroupWrap.className = "filter-group";
  enemyGroupWrap.innerHTML = `<h3>Enemies</h3><div class="toggle-group" id="enemy-filter-list"></div>`;
  itemGroup.after(enemyGroupWrap);
  console.debug("[sidebar] Added Enemies filter group");

  const enemyFilterList = document.getElementById("enemy-filter-list");
  async function loadEnemyFilters() {
    const npcs = await loadNpcDefinitions(db);
    console.debug("[sidebar] loadEnemyFilters() fetched", npcs.length, "NPCs");
    enemyFilterList.innerHTML = "";
    npcs.forEach(d => {
      const label = document.createElement("label");
      const cb    = document.createElement("input");
      cb.type            = "checkbox";
      cb.checked         = true;
      cb.dataset.enemyId = d.id;
      label.append(cb, ` ${d.name}`);
      enemyFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadEnemyFilters();

  // — Admin Tools —
  const existing = sidebar.querySelector("#sidebar-admin-tools");
  if (existing) existing.remove();

  const oldItemModal  = initItemDefinitionsModal(db);
  const testItemModal = initTestItemDefinitionsModal(db);
  const questModal    = initQuestDefinitionsModal(db);
  const npcModal      = initNpcDefinitionsModal(db);

  const adminWrap = document.createElement("div");
  adminWrap.id = "sidebar-admin-tools";

  [
    ["Manage Items",    () => oldItemModal.open()],
    ["Test Item Modal", () => testItemModal.open()],
    ["Manage Quests",   () => questModal.open()],
    ["Manage NPCs",     () => npcModal.open()]
  ].forEach(([txt, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = txt;
    btn.onclick     = fn;
    adminWrap.appendChild(btn);
  });

  sidebar.appendChild(adminWrap);
  console.debug("[sidebar] Admin tools injected");

  console.debug("[sidebar] setupSidebar() complete");
  return { filterMarkers, loadItemFilters, loadEnemyFilters };
}
