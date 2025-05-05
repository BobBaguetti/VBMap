// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 1.0 – preview panel for NPC definitions (2025‑05‑05)

/**
 * Simple preview panel for NPCs.
 * Shows icon & name header, roles badges, basic stats, and loot/vendor counts.
 */
export function createNpcPreviewPanel(container) {
  container.className = "";
  container.classList.add("preview-panel", "npc-preview-panel");

  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    container,
    setFromDefinition(def) {
      if (!def) {
        wrapper.innerHTML = "";
        return;
      }

      const iconHtml = def.iconUrl
        ? `<img src="${def.iconUrl}" class="preview-icon">`
        : "";

      const rolesHtml = Array.isArray(def.roles)
        ? def.roles
            .map(r => `<span class="badge role-${r.toLowerCase()}">${r}</span>`)
            .join(" ")
        : "";

      wrapper.innerHTML = `
        <div class="preview-header">
          ${iconHtml}
          <div class="preview-title">
            <div class="name">${def.name}</div>
            <div class="subtext">${def.subtext || ""}</div>
          </div>
        </div>
        <div class="preview-roles">${rolesHtml}</div>
        <div class="preview-stats">
          <span>HP: ${def.health}</span>
          <span>DMG: ${def.damage}</span>
        </div>
        <div class="preview-inv">
          Loot: ${def.lootPool?.length || 0} • Stock: ${def.vendorInventory?.length || 0}
        </div>
      `;
    },
    show() {
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
    }
  };
}
