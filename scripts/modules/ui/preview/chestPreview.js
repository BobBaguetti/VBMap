// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 1.4 – set explicit grid-template-columns in setFromDefinition

/**
 * Preview panel for Chest Types in the admin modal.
 * Renders the chest icon, name, and a grid of loot‐item thumbnails.
 */
export function createChestPreviewPanel(container) {
  // Ensure container is empty and has the correct class
  container.innerHTML = "";
  container.classList.add("chest-preview-panel");

  // Create & append elements
  const iconEl = document.createElement("img");
  iconEl.className = "chest-preview-icon";
  container.appendChild(iconEl);

  const nameEl = document.createElement("strong");
  nameEl.className = "chest-preview-name";
  container.appendChild(nameEl);

  const gridEl = document.createElement("div");
  gridEl.className = "chest-preview-grid";
  container.appendChild(gridEl);

  return {
    container,

    /**
     * Populate the preview with a chest definition object.
     * @param {Object} def
     *   - iconUrl:    URL of the chest icon
     *   - name:       Chest name
     *   - lootPool:   Array of item‐definition objects { imageSmall, name, quantity }
     *   - maxDisplay: number of items per row (optional)
     */
    setFromDefinition(def = {}) {
      // Icon and title
      iconEl.src         = def.iconUrl || "";
      nameEl.textContent = def.name     || "";

      // Build the grid, with explicit columns
      gridEl.innerHTML = "";
      const count = def.maxDisplay || (def.lootPool || []).length || 4;
      gridEl.style.display             = "grid";
      gridEl.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
      gridEl.style.gap                 = "4px";

      (def.lootPool || []).slice(0, def.maxDisplay || (def.lootPool || []).length || 4)
        .forEach(itemDef => {
          const slot = document.createElement("div");
          slot.className = "chest-slot";
          slot.title     = itemDef.name || "";

          const img = document.createElement("img");
          img.src   = itemDef.imageSmall || "";
          img.className = "chest-slot-img";
          slot.appendChild(img);

          if (itemDef.quantity > 1) {
            const qty = document.createElement("span");
            qty.className = "chest-slot-qty";
            qty.textContent = itemDef.quantity;
            slot.appendChild(qty);
          }

          gridEl.appendChild(slot);
        });
    },

    show() {
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
    }
  };
}
