// @keep:    Comments must NOT be deleted unless their associated code is also deleted;
//           edits to comments only when code changes.
// @file:    /scripts/modules/sidebar/sidebarManager.js
// @version: 9.5

import { loadItemDefinitions }       from "../services/itemDefinitionsService.js";
import { loadNpcDefinitions }        from "../services/npcDefinitionsService.js";
import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";
import { initTestItemDefinitionsModal } from "../ui/modals/testItemDefinitionsModal.js";
import { initQuestDefinitionsModal } from "../ui/modals/questDefinitionsModal.js";
import { initNpcDefinitionsModal }   from "../ui/modals/npcDefinitionsModal.js";

export async function setupSidebar(
  map, layers, allMarkers, db,
  { enableGrouping, disableGrouping }
) {
  console.log("[sidebar] setupSidebar()");

  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");
  const settingsSect  = document.getElementById("settings-section");

  if (!searchBar || !sidebarToggle || !sidebar || !settingsSect) {
    console.warn("[sidebar] Missing elements");
    return { filterMarkers() {} };
  }

  // Dark‐style the search input
  searchBar.classList.add("ui-input");

  // Sidebar show/hide
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Accordion for filters
  document.querySelectorAll(".filter-group").forEach(gr => {
    const h = gr.querySelector("h3");
    h.addEventListener("click", () => {
      gr.classList.toggle("collapsed");
      console.log(`[sidebar] toggled ${gr.id || h.textContent}`);
    });
  });

  /* ----------------------------------------------------------------
     Settings section
  ---------------------------------------------------------------- */
  // remove any static labels
  settingsSect.querySelectorAll("label").forEach(l => l.remove());

  // — Marker Grouping —
  const gLab = document.createElement("label");
  gLab.innerHTML = `<input type="checkbox" id="enable-grouping"/><span>Enable Marker Grouping</span>`;
  settingsSect.appendChild(gLab);
  const gCb = document.getElementById("enable-grouping");
  gCb.checked = true;  // default ON
  gCb.addEventListener("change", () => {
    console.log("[sidebar] marker grouping:", gCb.checked);
    gCb.checked ? enableGrouping() : disableGrouping();
  });

  // — Small Markers (50%) —
  const sLab = document.createElement("label");
  sLab.innerHTML = `<input type="checkbox" id="toggle-small-markers"/><span>Small Markers (50%)</span>`;
  settingsSect.appendChild(sLab);
  const sCb = document.getElementById("toggle-small-markers");
  sCb.checked = false;
  sCb.addEventListener("change", () => {
    console.log("[sidebar] small markers:", sCb.checked);
    const scale = sCb.checked ? 0.5 : 1;
    allMarkers.forEach(({ markerObj }) => {
      const el = markerObj.getElement();
      if (el) el.style.transform = `scale(${scale})`;
    });
  });

  /* ----------------------------------------------------------------
     Core filtering logic
  ---------------------------------------------------------------- */
  function filterMarkers() {
    const q     = (searchBar.value || "").toLowerCase();
    const pveOn = document.getElementById("toggle-pve")?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const isNpc      = data.type === "npc";
      const showPvE    = pveOn || !isNpc;
      const matchName  = data.name?.toLowerCase().includes(q);

      let mainOK = true;
      document.querySelectorAll("#main-filters .toggle-group input")
        .forEach(cb => { if (data.type === cb.dataset.layer && !cb.checked) mainOK = false; });

      let itemOK = true;
      if (data.predefinedItemId) {
        const cb = document.querySelector(
          `#item-filter-list input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemOK = false;
      }

      let enemyOK = true;
      if (isNpc) {
        const cb = document.querySelector(
          `#enemy-filter-list input[data-enemy-id="${data.id}"]`
        );
        if (cb && !cb.checked) enemyOK = false;
      }

      const should = showPvE && matchName && mainOK && (isNpc ? enemyOK : itemOK);
      const grp    = layers[data.type];
      if (!grp) return;

      should ? grp.addLayer(markerObj) : grp.removeLayer(markerObj);
    });
  }

  // Wire up filters
  searchBar.addEventListener("input", filterMarkers);
  document.querySelectorAll("#main-filters .toggle-group input")
    .forEach(cb => cb.addEventListener("change", filterMarkers));
  document.getElementById("toggle-pve")?.addEventListener("change", filterMarkers);

  /* ----------------------------------------------------------------
     Populate Item & Enemy filters
  ---------------------------------------------------------------- */
  console.log("[sidebar] loadItemFilters()");
  const itemList = document.getElementById("item-filter-list");
  async function loadItemFilters() {
    itemList.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.filter(d => d.showInFilters).forEach(d => {
      const lab = document.createElement("label");
      const cb  = document.createElement("input");
      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.itemId = d.id;
      const sp = document.createElement("span");
      sp.textContent = d.name;
      lab.append(cb, sp);
      itemList.appendChild(lab);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadItemFilters();

  console.log("[sidebar] loadEnemyFilters()");
  const eWrap = document.createElement("div");
  eWrap.className = "filter-group";
  eWrap.innerHTML = `<h3>Enemies</h3><div class="toggle-group" id="enemy-filter-list"></div>`;
  document.getElementById("item-filters").after(eWrap);

  const eList = document.getElementById("enemy-filter-list");
  async function loadEnemyFilters() {
    eList.innerHTML = "";
    const npcs = await loadNpcDefinitions(db);
    npcs.forEach(d => {
      const lab = document.createElement("label");
      const cb  = document.createElement("input");
      cb.type            = "checkbox";
      cb.checked         = true;
      cb.dataset.enemyId = d.id;
      const sp = document.createElement("span");
      sp.textContent = d.name;
      lab.append(cb, sp);
      eList.appendChild(lab);
      cb.addEventListener("change", filterMarkers);
    });
  }
  await loadEnemyFilters();

  /* ----------------------------------------------------------------
     Admin Tools
  ---------------------------------------------------------------- */
  console.log("[sidebar] Admin tools injected");
  sidebar.querySelector(".admin-header")?.remove();
  const ah = document.createElement("h2");
  ah.className = "admin-header";
  ah.innerHTML = `<i class="fas fa-tools"></i> Admin Tools`;
  sidebar.appendChild(ah);

  sidebar.querySelector("#sidebar-admin-tools")?.remove();
  const aw = document.createElement("div");
  aw.id = "sidebar-admin-tools";
  [
    ["Manage Items",    () => initItemDefinitionsModal(db).open()],
    ["Test Item Modal", () => initTestItemDefinitionsModal(db).open()],
    ["Manage Quests",   () => initQuestDefinitionsModal(db).open()],
    ["Manage NPCs",     () => initNpcDefinitionsModal(db).open()]
  ].forEach(([txt, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = txt;
    btn.onclick     = fn;
    aw.append(btn);
  });
  sidebar.appendChild(aw);

  // initial draw
  filterMarkers();

  return { filterMarkers, loadItemFilters, loadEnemyFilters };
}
