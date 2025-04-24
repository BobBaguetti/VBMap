// @keep:    Comments must NOT be deleted unless their associated code is also deleted; edits to comments only when code changes.
// @file:    /scripts/modules/sidebar/sidebarManager.js
// @version: 9.2

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
  const settingsSect  = document.getElementById("settings-section");

  if (!searchBar || !sidebarToggle || !sidebar || !settingsSect) {
    console.warn("[sidebar] Missing elements");
    return { filterMarkers() {} };
  }

  // Dark-style the search input
  searchBar.classList.add("ui-input");

  // Sidebar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Accordion behavior for filters
  document.querySelectorAll(".filter-group").forEach(group => {
    const header = group.querySelector("h3");
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.log(`[sidebar] toggled ${group.id || header.textContent}`);
    });
  });

  /* ----------------------------------------------------------------
     Settings toggles (injected here)
  ---------------------------------------------------------------- */
  // clear any static labels
  settingsSect.querySelectorAll("label").forEach(l => l.remove());

  // — Marker Grouping —
  const groupingLabel = document.createElement("label");
  groupingLabel.innerHTML = `<input type="checkbox" id="enable-grouping" /><span>Enable Marker Grouping</span>`;
  settingsSect.appendChild(groupingLabel);
  const groupingCb = document.getElementById("enable-grouping");
  groupingCb.checked = false; // default off
  groupingCb.addEventListener("change", () => {
    console.log("[sidebar] marker grouping:", groupingCb.checked);
    if (layers.Item) {
      groupingCb.checked ? map.addLayer(layers.Item)
                         : map.removeLayer(layers.Item);
    }
  });

  // — Small Markers (50%) —
  const smallLabel = document.createElement("label");
  smallLabel.innerHTML = `<input type="checkbox" id="toggle-small-markers" /><span>Small Markers (50%)</span>`;
  settingsSect.appendChild(smallLabel);
  const smallCb = document.getElementById("toggle-small-markers");
  smallCb.checked = false;
  smallCb.addEventListener("change", () => {
    console.log("[sidebar] small markers:", smallCb.checked);
    const scale = smallCb.checked ? 0.5 : 1;
    allMarkers.forEach(({ markerObj }) => {
      const el = markerObj.getElement();
      if (el) el.style.transform = `scale(${scale})`;
    });
  });

  /* ----------------------------------------------------------------
     Core filtering logic
  ---------------------------------------------------------------- */
  function filterMarkers() {
    const nameQuery = (searchBar.value || "").toLowerCase();
    const pveOn     = document.getElementById("toggle-pve")?.checked ?? true;

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

  // Wire up search + main toggles
  searchBar.addEventListener("input", filterMarkers);
  document
    .querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  document.getElementById("toggle-pve")?.addEventListener("change", filterMarkers);

  /* ----------------------------------------------------------------
     Populate Item & Enemy filters
  ---------------------------------------------------------------- */
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

  console.log("[sidebar] loadEnemyFilters()");
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

  /* ----------------------------------------------------------------
     Admin Tools
  ---------------------------------------------------------------- */
  console.log("[sidebar] Admin tools injected");
  const existing = sidebar.querySelector("#sidebar-admin-tools");
  if (existing) existing.remove();

  // create and inject Admin Tools header
  const adminHeader = document.createElement("h2");
  adminHeader.className = "admin-header";
  adminHeader.innerHTML = `<i class="fas fa-tools"></i> Admin Tools`;
  sidebar.appendChild(adminHeader);

  // create and inject button container
  const adminWrap = document.createElement("div");
  adminWrap.id = "sidebar-admin-tools";
  [
    ["Manage Items",    () => initItemDefinitionsModal(db).open()],
    ["Test Item Modal", () => initTestItemDefinitionsModal(db).open()],
    ["Manage Quests",   () => initQuestDefinitionsModal(db).open()],
    ["Manage NPCs",     () => initNpcDefinitionsModal(db).open()]
  ].forEach(([txt, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = txt;
    btn.onclick     = fn;
    adminWrap.appendChild(btn);
  });
  sidebar.appendChild(adminWrap);

  // initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters, loadEnemyFilters };
}
