// @file: /scripts/modules/ui/preview/chestPreview.js
// @version: 2 – uses shared preview-panel CSS

export function createChestPreviewPanel(container) {
  container.className = "";                               // reset
  container.classList.add("preview-panel", "chest-preview-panel");

  /* ─── static DOM structure ─────────────────────────────── */
  const iconEl = document.createElement("img");
  iconEl.className = "chest-preview-icon";
  container.appendChild(iconEl);

  const nameEl = document.createElement("strong");
  nameEl.className = "chest-preview-name";
  container.appendChild(nameEl);

  const gridEl = document.createElement("div");
  gridEl.className = "chest-preview-grid";
  container.appendChild(gridEl);

  /* ─── public API ───────────────────────────────────────── */
  return {
    container,
    setFromDefinition(def = {}) {
      iconEl.src         = def.iconUrl || "";
      nameEl.textContent = def.name    || "";

      gridEl.innerHTML = "";
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
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}
