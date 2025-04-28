// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 1.6 – unified hide/show and full grid logic

/**
 * Preview panel for Chest Types in the admin modal.
 * Mirrors the item preview frame and behavior.
 */
export function createChestPreviewPanel(container) {
  // wipe & apply class
  container.innerHTML = "";
  container.className = "chest-preview-panel";

  // icon
  const iconEl = document.createElement("img");
  iconEl.className = "chest-preview-icon";
  container.appendChild(iconEl);

  // name
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
     * @param {Object} def
     *   iconUrl, name,
     *   lootPool: Array<{imageSmall,name,quantity}>,
     *   maxDisplay?: number
     */
    setFromDefinition(def = {}) {
      iconEl.src         = def.iconUrl || "";
      nameEl.textContent = def.name    || "";

      gridEl.innerHTML = "";
      // number of columns = maxDisplay or up to 4 by default
      const cols = def.maxDisplay || 4;
      gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;

      (def.lootPool || []).slice(0, cols).forEach(item => {
        const slot = document.createElement("div");
        slot.className = "chest-slot";
        slot.title     = item.name || "";

        const img = document.createElement("img");
        img.src       = item.imageSmall || "";
        img.className = "chest-slot-img";
        slot.appendChild(img);

        if (item.quantity > 1) {
          const qty = document.createElement("span");
          qty.className   = "chest-slot-qty";
          qty.textContent = item.quantity;
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
