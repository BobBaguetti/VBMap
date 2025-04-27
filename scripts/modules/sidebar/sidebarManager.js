// @file: /scripts/modules/sidebar/sidebarManager.js
// @version: 10.1

import { loadItemDefinitions }       from "../services/itemDefinitionsService.js";
import { loadNpcDefinitions }        from "../services/npcDefinitionsService.js";
import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";
import { initQuestDefinitionsModal } from "../ui/modals/questDefinitionsModal.js";
import { initNpcDefinitionsModal }   from "../ui/modals/npcDefinitionsModal.js";
import { initChestDefinitionsModal } from "../ui/modals/chestDefinitionsModal.js";

export async function setupSidebar(
  map, layers, allMarkers, db,
  { enableGrouping, disableGrouping }
) {
  console.log("[sidebar] setupSidebar() running");
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const settingsSect  = document.getElementById("settings-section");

  if (!searchBar || !sidebarToggle || !sidebar || !settingsSect) {
    console.warn("[sidebar] Missing elements");
    return { filterMarkers() {}, loadItemFilters: async () => {} };
  }

  // ─── Basic UI Setup ───────────────────────────────────────────────
  searchBar.classList.add("ui-input");

  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.log(`[sidebar] toggled ${group.id || header.textContent}`);
    });
  });

  // ─── Settings Toggles ─────────────────────────────────────────────
  settingsSect.querySelectorAll("label").forEach(l => l.remove());

  const groupingLabel = document.createElement("label");
  groupingLabel.innerHTML = `<input type="checkbox" id="enable-grouping" /><span>Enable Marker Grouping</span>`;
  settingsSect.appendChild(groupingLabel);
  const groupingCb = document.getElementById("enable-grouping");
  groupingCb.checked = false;
  groupingCb.addEventListener("change", () => {
    console.log("[sidebar] marker grouping:", groupingCb.checked);
    groupingCb.checked ? enableGrouping() : disableGrouping();
  });

  const smallLabel = document.createElement("label");
  smallLabel.innerHTML = `<input type="checkbox" id="toggle-small-markers" /><span>Small Markers (50%)</span>`;
  settingsSect.appendChild(smallLabel);
  const smallCb = document.getElementById("toggle-small-markers");
  smallCb.checked = false;
  smallCb.addEventListener("change", () => {
    console.log("[sidebar] small markers:", smallCb.checked);
    document.getElementById("map")
      .classList.toggle("small-markers", smallCb.checked);
  });

  // ─── Core Filtering Logic ─────────────────────────────────────────
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = document.getElementById("toggle-pve")?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const isNpc       = data.type === "npc";
      const matchesPvE  = pveOn || !isNpc;
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      let mainVisible = true;
      document.querySelectorAll("#main-filters .toggle-group input")
        .forEach(cb => {
          if (data.type === cb.dataset.layer && !cb.checked)
            mainVisible = false;
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

  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  document.getElementById("toggle-pve")?.addEventListener("change", filterMarkers);

  // ─── Add “Chests” Toggle ─────────────────────────────────────────
  const mainGroup = document.querySelector("#main-filters .toggle-group");
  const chestLabel = document.createElement("label");
  chestLabel.innerHTML = `<input type="checkbox" checked data-layer="Chest"/><span>Chests</span>`;
  mainGroup.append(chestLabel);
  chestLabel.querySelector("input")
    .addEventListener("change", filterMarkers);

  // ─── Item Filters ─────────────────────────────────────────────────
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

  // ─── Enemy Filters ────────────────────────────────────────────────
  const enemyWrap = document.createElement("div");
  enemyWrap.className = "filter-group";
  enemyWrap.innerHTML = `<h3>Enemies</h3><div class="toggle-group" id="enemy-filter-list"></div>`;
  document.getElementById("item-filters").after(enemyWrap);

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

  // ─── Admin Tools ──────────────────────────────────────────────────
  sidebar.querySelector(".admin-header")?.remove();
  sidebar.querySelector("#sidebar-admin-tools")?.remove();

  const adminHeader = document.createElement("h2");
  adminHeader.className   = "admin-header";
  adminHeader.textContent = "🛠 Admin Tools";
  adminHeader.style.display = "none";
  sidebar.appendChild(adminHeader);

  const adminWrap = document.createElement("div");
  adminWrap.id = "sidebar-admin-tools";
  adminWrap.style.display = "none";

  [
    ["Manage Items",       () => initItemDefinitionsModal(db).open()],
    ["Manage Quests",      () => initQuestDefinitionsModal(db).open()],
    ["Manage NPCs",        () => initNpcDefinitionsModal(db).open()],
    ["Manage Chest Types", () => initChestDefinitionsModal(db).open()]
  ].forEach(([txt, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = txt;
    btn.onclick     = fn;
    adminWrap.appendChild(btn);
  });

  sidebar.appendChild(adminWrap);

  // Show admin tools if body already has the class
  if (document.body.classList.contains("is-admin")) {
    adminHeader.style.display = "";
    adminWrap.style.display   = "";
  }

  // Initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters };
}
