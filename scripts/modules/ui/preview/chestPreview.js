// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 1.0

/**
 * Preview panel for Chest Types in the admin modal.
 * Renders the chest icon and a sample grid of item slots.
 */
export function createChestPreviewPanel(container) {
    container.classList.add("chest-preview-panel");
    // we'll populate on setFromDefinition
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
       * @param {Object} def  — { iconUrl, name, lootPool: [ { imageSmall, name }... ], maxDisplay }
       */
      setFromDefinition(def = {}) {
        // Clear
        gridEl.innerHTML = "";
        // Icon & title
        iconEl.src = def.iconUrl || "";
        nameEl.textContent = def.name || "";
  
        // Build a sample grid row (up to maxDisplay, or 4)
        const count = def.maxDisplay || 4;
        gridEl.style.display = "grid";
        gridEl.style.gap = "4px";
        gridEl.style.gridTemplateColumns = `repeat(${count},1fr)`;
        (def.lootPool || []).slice(0, count).forEach(itemDef => {
          const slot = document.createElement("div");
          slot.className = "chest-slot";
          slot.title = itemDef.name || "";
          const img = document.createElement("img");
          img.src = itemDef.imageSmall || "";
          img.style.width = "100%";
          slot.appendChild(img);
          gridEl.appendChild(slot);
        });
      },
  
      show() {
        container.style.display = "";
      },
  
      hide() {
        container.style.display = "none";
      }
    };
  }
  