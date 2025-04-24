// @keep: Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @file: /scripts/modules/sidebar/sidebarManager.js
// @version: 10.0

import { loadItemDefinitions }       from "../services/itemDefinitionsService.js";
import { loadNpcDefinitions }        from "../services/npcDefinitionsService.js";
import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";        // old modal
import { initTestItemDefinitionsModal } from "../ui/modals/testItemDefinitionsModal.js"; // test modal
import { initQuestDefinitionsModal } from "../ui/modals/questDefinitionsModal.js";
import { initNpcDefinitionsModal }   from "../ui/modals/npcDefinitionsModal.js";

export async function setupSidebar(map, layers, allMarkers, db) {
  console.log("[sidebar] setupSidebar() running");
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const mapContainer  = document.getElementById("map");

  if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
    console.warn("[sidebar] Missing elements");
    return { filterMarkers() {} };
  }

  // style searchbar
  searchBar.classList.add("ui-input");

  // Sidebar toggle
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
      console.log(`[sidebar] toggled ${group.id}`);
    });
  });

  // PvE master toggle
  const mainToggleGroup = document.querySelector("#main-filters .toggle-group");
  const pveLabel        = document.createElement("label");
  pveLabel.innerHTML    = `<input type="checkbox" id="toggle-pve" checked /><span>PvE</span>`;
  mainToggleGroup.appendChild(pveLabel);
  console.log("[sidebar] PvE toggle appended");

  // Small-Markers toggle
  const settingsGroup = sidebar.querySelector(".sidebar-section:nth-of-type(2) .sidebar-section, .sidebar-section:nth-of-type(2)"); 
  // (the “Settings” section is 2nd .sidebar-section)
  const smallLabel    = document.createElement("label");
  smallLabel.innerHTML = `<input type="checkbox" id="enable-small-markers" /><span>Small Markers (50%)</span>`;
  settingsGroup.appendChild(smallLabel);
  document.getElementById("enable-small-markers")
    .addEventListener("change", e => {
      mapContainer.classList.toggle("small-markers", e.target.checked);
    });

  // Core filtering
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = document.getElementById("toggle-pve").checked;

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

      shouldShow ? layerGroup.addLayer(markerObj)
                 : layerGroup.removeLayer(markerObj);
    });
  }

  // Wire up the master inputs
  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  document.getElementById("toggle-pve").addEventListener("change", filterMarkers);

  // — Items — dynamically populate with span-wrapped labels
  console.log("[sidebar] loadItemFilters()");
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
      const span = document.createElement("span");
      span.textContent = d.name;
      label.append(cb, span);
      itemFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadItemFilters();

  // — Enemies — dynamically populate same way
  console.log("[sidebar] loadEnemyFilters()");
  const enemyGroupWrap  = document.createElement("div");
  enemyGroupWrap.className = "filter-group";
  enemyGroupWrap.innerHTML = `<h3>Enemies</h3><div class="toggle-group" id="enemy-filter-list"></div>`;
  document.getElementById("item-filters").after(enemyGroupWrap);

  const enemyFilterList = document.getElementById("enemy-filter-list");
  async function loadEnemyFilters() {
    enemyFilterList.innerHTML = "";
    const npcs = await loadNpcDefinitions(db);
    npcs.forEach(d => {
      const label = document.createElement("label");
      const cb    = document.createElement("input");
      cb.type            = "checkbox";
      cb.checked         = true;
      cb.dataset.enemyId = d.id;
      const span = document.createElement("span");
      span.textContent = d.name;
      label.append(cb, span);
      enemyFilterList.append(label);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadEnemyFilters();

  // — Admin Tools —
  console.log("[sidebar] Admin tools injected");
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

  // Finally, do an initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters, loadEnemyFilters };
}
