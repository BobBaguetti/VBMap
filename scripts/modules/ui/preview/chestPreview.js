// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 1.5 – mirror itemPreview show/hide via hidden/visible classes

/**
 * Preview panel for Chest Types in the admin modal.
 * Renders the chest icon, name, and a grid of loot‐item thumbnails.
 */
export function createChestPreviewPanel(container) {
  // clear and set up classes
  container.innerHTML = "";
  container.classList.add("chest-preview-panel", "hidden");

  // icon
  const iconEl = document.createElement("img");
  iconEl.className = "chest-preview-icon";
  container.appendChild(iconEl);

  // title
  const nameEl = document.createElement("strong");
  nameEl.className = "chest-preview-name";
  container.appendChild(nameEl);

  // grid container
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
      // icon & name
      iconEl.src = def.iconUrl || "";
      nameEl.textContent = def.name || "";

      // build grid
      gridEl.innerHTML = "";
      const count = def.maxDisplay || (def.lootPool||[]).length || 4;
      gridEl.style.gridTemplateColumns = `repeat(${count}, 1fr)`;

      (def.lootPool || [])
        .slice(0, count)
        .forEach(item => {
          const slot = document.createElement("div");
          slot.className = "chest-slot";
          slot.title = item.name || "";

          const img = document.createElement("img");
          img.src = item.imageSmall || "";
          img.className = "chest-slot-img";
          slot.appendChild(img);

          if (item.quantity > 1) {
            const qty = document.createElement("span");
            qty.className = "chest-slot-qty";
            qty.textContent = item.quantity;
            slot.appendChild(qty);
          }

          gridEl.appendChild(slot);
        });
    },

    show() {
      container.classList.remove("hidden");
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
      container.classList.add("hidden");
    }
  };
}
