// @file: /scripts/modules/ui/components/listEntryRenderer.js
// @version: 1.0 – shared definition entry renderer

/**
 * Truncate text to a max length, adding ellipsis if needed.
 * @param {string} str
 * @param {number} maxLen
 */
function truncate(str, maxLen = 50) {
    if (!str) return "";
    return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
  }
  
  /**
   * Create a badge element for counts or quantities.
   * @param {string|number} value
   */
  function createBadge(value) {
    const span = document.createElement("span");
    span.className = "entry-badge";
    span.textContent = value;
    return span;
  }
  
  /**
   * Shared renderer for a definition entry.
   *
   * @param {Object} def                         – the definition object
   * @param {string} layout                      – current layout ("row"|"stacked"|"gallery")
   * @param {{ onClick: ()=>void, onDelete: ()=>void }} actions
   * @returns {HTMLElement}
   */
  export function renderListEntry(def, layout, { onClick, onDelete }) {
    // Container
    const entry = document.createElement("div");
    entry.classList.add("entry-row", `layout-${layout}`);
    entry.tabIndex = 0;
    entry.onclick = onClick;
  
    // Content wrapper
    const content = document.createElement("div");
    content.className = "entry-content";
  
    // Name + type/rarity
    const nameEl = document.createElement("div");
    nameEl.className = "entry-name";
    nameEl.textContent = def.name || "Untitled";
  
    const meta = [];
    if (def.type)   meta.push(def.type);
    if (def.rarity) meta.push(def.rarity.toUpperCase());
    if (meta.length) {
      const metaEl = document.createElement("small");
      metaEl.className = "entry-meta";
      metaEl.textContent = meta.join(" • ");
      content.appendChild(metaEl);
    }
  
    content.append(nameEl);
  
    // Description (stacked or gallery still show it)
    if (def.description) {
      const descEl = document.createElement("div");
      descEl.className = "entry-description";
      descEl.textContent = truncate(def.description, layout === "gallery" ? 30 : 50);
      content.appendChild(descEl);
    }
  
    // Details area (row/stacked may show badges)
    const detailsEl = document.createElement("div");
    detailsEl.className = "entry-details";
    // badge based on def.count or def.quantity
    const count = def.count ?? def.quantity;
    if (count != null) {
      detailsEl.appendChild(createBadge(count));
    }
    content.appendChild(detailsEl);
  
    entry.appendChild(content);
  
    // Delete button (if applicable)
    if (typeof onDelete === "function") {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "entry-delete ui-button-delete";
      delBtn.onclick = e => {
        e.stopPropagation();
        onDelete();
      };
      entry.appendChild(delBtn);
    }
  
    return entry;
  }
  