// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 3 – hide empty icon, rarity-bordered square slots

export function createChestPreviewPanel(container) {
  container.className = "";
  container.classList.add("preview-panel", "chest-preview-panel");

  /* header */
  const iconEl = document.createElement("img");
  iconEl.className = "chest-preview-icon";
  container.appendChild(iconEl);

  const nameEl = document.createElement("strong");
  nameEl.className = "chest-preview-name";
  container.appendChild(nameEl);

  /* loot grid */
  const gridEl = document.createElement("div");
  gridEl.className = "chest-preview-grid";
  container.appendChild(gridEl);

  /* helper: square, rarity-coloured slot */
  function createSlot(item = {}) {
    const slot = document.createElement("div");
    slot.className = "chest-slot";
    slot.title = item.name || "";

    slot.style.borderColor = item.rarityColor || "#333";

    if (item.imageSmall) {
      const img = document.createElement("img");
      img.src = item.imageSmall;
      img.className = "chest-slot-img";
      slot.appendChild(img);
    }
    if (item.quantity > 1) {
      const qty = document.createElement("span");
      qty.className = "chest-slot-qty";
      qty.textContent = item.quantity;
      slot.appendChild(qty);
    }
    return slot;
  }

  return {
    container,

    /** @param {Object} def */
    setFromDefinition(def = {}) {
      /* icon + header text */
      if (def.iconUrl) {
        iconEl.src = def.iconUrl;
        iconEl.style.display = "block";
      } else {
        iconEl.style.display = "none";
      }
      nameEl.textContent = def.name || "";

      /* grid */
      gridEl.innerHTML = "";
      const cols = def.maxDisplay || 4;
      gridEl.style.gridTemplateColumns = `repeat(${cols}, 48px)`;

      (def.lootPool || []).slice(0, cols)
        .forEach(item => gridEl.appendChild(createSlot(item)));
      /* pad to always show square grid */
      while (gridEl.childElementCount < cols) {
        gridEl.appendChild(createSlot());
      }
    },

    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}
