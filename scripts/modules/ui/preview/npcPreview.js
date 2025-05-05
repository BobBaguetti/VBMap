// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 2.0

/**
 * Builds an NPC preview panel and returns its API.
 * Usage:
 *   const preview = createNpcPreviewPanel(containerEl);
 *   preview.setFromDefinition(def);
 *   preview.show(); / preview.hide();
 */
export function createNpcPreviewPanel(container) {
  container.className = "preview-panel npc-preview-panel";
  const wrap = document.createElement("div");
  wrap.className = "preview-popup-wrapper";
  container.appendChild(wrap);

  /** Helper: hex colour or fallback */
  const col = (hex, fb = "#E5E6E8") => hex || fb;

  function setFromDefinition(def) {
    if (!def) { wrap.innerHTML = ""; return; }

    const icon = def.imageSmallUrl
      ? `<img src="${def.imageSmallUrl}" class="preview-icon">`
      : "";

    const roles = (def.roles || [])
      .map(r => `<span class="badge role-${r.toLowerCase()}">${r}</span>`)
      .join(" ");

    wrap.innerHTML = `
      <div class="preview-header">
        ${icon}
        <div class="preview-title" style="color:${col(def.nameColor)}">
          ${def.name || "<span style='opacity:.5'>(unnamed)</span>"}
        </div>
      </div>

      <div class="preview-roles">${roles}</div>

      <div class="preview-stats">
        <span style="color:${col(def.healthColor)}">HP ${def.health}</span>
        <span style="color:${col(def.damageColor)}">DMG ${def.damage}</span>
      </div>

      <div class="preview-inv">
        Loot ${def.lootPool?.length || 0} • Stock ${def.vendorInventory?.length || 0}
      </div>
    `;
  }

  return {
    container,
    setFromDefinition,
    show: () => container.classList.add("visible"),
    hide: () => container.classList.remove("visible")
  };
}
