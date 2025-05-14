// @file: src/modules/sidebar/renderSidebar.js
// @version: 1.2 — include sidebar‐toggle button in JS shell

export function renderSidebarShell() {
  // 1) Ensure the sidebar-toggle button exists, inserting it if not
  let toggleBtn = document.getElementById("sidebar-toggle");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "sidebar-toggle";
    toggleBtn.textContent = "◀︎";
    toggleBtn.className = "sidebar-toggle-button";
    // Insert it at the very top of the body
    document.body.insertBefore(toggleBtn, document.body.firstChild);
  }

  // 2) Populate the sidebar container
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.warn("[renderSidebarShell] #sidebar element not found");
    return;
  }

  sidebar.innerHTML = `
    <h1>
      <img
        src="https://res.cloudinary.com/dtty7zxjh/image/upload/v1746941747/0g_VaultbreakersLogo_Blue_Fullsize_wbaf0o.png"
        alt="Vaultbreakers Map Logo"
      />
    </h1>
    <p class="sidebar-logo__subtitle">vaultbreakers interactive map</p>

    <!-- TOOLBAR -->
    <div id="sidebar-toolbar" class="sidebar-section toolbar">
      <button id="btn-settings" aria-label="Settings">
        <i class="fas fa-cog"></i>
      </button>
      <button id="btn-about" aria-label="About">
        <i class="fas fa-question-circle"></i>
      </button>
      <button id="btn-discord" aria-label="Discord">
        <i class="fab fa-discord"></i>
      </button>
    </div>

    <!-- SEARCH -->
    <div id="sidebar-search" class="sidebar-section">
      <h2><i class="fas fa-search"></i> Search</h2>
      <div class="search-wrapper">
        <input type="search" id="search-bar" placeholder="Search items/locations…"/>
        <button id="search-clear" aria-label="Clear search">&times;</button>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="sidebar-section" id="filters-section">
      <h2><i class="fas fa-filter"></i> Filters</h2>

      <!-- Main layer toggles -->
      <div class="filter-group" id="main-filters">
        <h3><i class="fas fa-layer-group group-icon"></i>Main</h3>
        <div class="toggle-group"></div>
      </div>

      <!-- Item filters -->
      <div class="filter-group" id="item-filters">
        <h3><i class="fas fa-box-open group-icon"></i>Items</h3>
        <div class="toggle-group" id="item-filter-list"></div>
      </div>

      <!-- Chest filters -->
      <div class="filter-group" id="chest-filters">
        <h3><i class="fas fa-dungeon group-icon"></i>Chests</h3>
        <div class="toggle-group" id="chest-filter-list"></div>
      </div>

      <!-- NPC filters -->
      <div class="filter-group" id="npc-hostile-filters">
        <h3><i class="fas fa-skull-crossbones group-icon"></i>Hostile NPCs</h3>
        <div class="toggle-group" id="npc-hostile-list"></div>
      </div>
      <div class="filter-group" id="npc-friendly-filters">
        <h3><i class="fas fa-user-friends group-icon"></i>Friendly NPCs</h3>
        <div class="toggle-group" id="npc-friendly-list"></div>
      </div>
    </div>

    <!-- SETTINGS -->
    <div class="sidebar-section" id="settings-section">
      <h2><i class="fas fa-cog"></i> Settings</h2>
      <div class="toggle-group">
        <label>
          <input type="checkbox" id="toggle-grouping"/>
          <span>Enable Marker Grouping</span>
        </label>
        <label>
          <input type="checkbox" id="toggle-small-markers"/>
          <span>Small Markers (50%)</span>
        </label>
      </div>
    </div>

    <!-- ADMIN TOOLS -->
    <div class="sidebar-section" id="admin-tools-section">
      <h2><i class="fas fa-tools"></i> Admin Tools</h2>
      <div class="toggle-group">
        <button id="manage-items-btn">Manage Items</button>
        <button id="manage-chests-btn">Manage Chests</button>
      </div>
    </div>
  `.trim();
}
