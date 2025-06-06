// @file: src/modules/definition/list/definitionListManager.js
// @version: 6.11 — use goldColor for coins icon in entry list

import { goldColor } from "../../../shared/utils/color/colorPresets.js";

/**
 * Creates and manages a sortable, filterable definition list.
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  onEntryClick,
  onDelete,
  getCurrentLayout = () => "row",
  renderEntry
}) {
  let layout     = getCurrentLayout();
  let filterTerm = "";

  function defaultRenderer(def, layout, onClick, onDelete) {
    const entry = document.createElement("div");
    entry.className = `entry entry--${layout}`;  // was def-entry
    Object.assign(entry.style, {
      display:       "flex",
      alignItems:    "center",
      padding:       "0.6em",
      margin:        "0.3em 0",
      background:    "var(--bg-20)",
      borderRadius:  "6px",
      cursor:        "pointer"
    });

    // Thumbnail
    if (def.imageSmall) {
      const thumb = document.createElement("img");
      thumb.src    = def.imageSmall;
      thumb.alt    = def.name;
      Object.assign(thumb.style, {
        width:        "36px",
        height:       "36px",
        objectFit:    "cover",
        borderRadius: "4px",
        marginRight:  "0.8em",
        flexShrink:   "0"
      });
      entry.appendChild(thumb);
    }

    // Main content
    const main = document.createElement("div");
    main.style.flex = "1";
    main.style.minWidth = "0";  // allow children to shrink

    // Header: (devName) name | TYPE • RARITY
    const header = document.createElement("div");
    Object.assign(header.style, {
      display:       "flex",
      alignItems:    "baseline",
      gap:           "0.4em",
      marginBottom:  "0.2em",
      minWidth:      "0"
    });
    const nameEl = document.createElement("span");
    // If devName exists, prefix it in parentheses
    const namePrefix = def.devName ? `(${def.devName}) ` : "";
    nameEl.textContent = `${namePrefix}${def.name}`;
    Object.assign(nameEl.style, { fontWeight: "600", flexShrink: "1", minWidth: "0" });
    header.appendChild(nameEl);

    const metaEl = document.createElement("span");
    const typeText   = (def.itemType || def.category || "").toUpperCase();
    const rarityText = def.rarity ? def.rarity.toUpperCase() : "";
    metaEl.textContent = `| ${typeText}${rarityText ? " • " + rarityText : ""}`;
    Object.assign(metaEl.style, {
      fontSize:      "0.9em",
      color:         "var(--text-secondary)",
      flexShrink:    "0"
    });
    header.appendChild(metaEl);
    main.appendChild(header);

    // Sub-row: description + value
    const sub = document.createElement("div");
    Object.assign(sub.style, {
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            "0.6em",
      minWidth:       "0"
    });
    const descEl = document.createElement("span");
    descEl.textContent = def.description || "";
    Object.assign(descEl.style, {
      fontSize:       "0.9em",
      color:          "var(--text-secondary)",
      flex:           "1 1 auto",
      maxWidth:       "72%",
      minWidth:       "0",
      whiteSpace:     "nowrap",
      overflow:       "hidden",
      textOverflow:   "ellipsis"
    });
    sub.appendChild(descEl);

    if (def.value) {
      const valEl = document.createElement("span");
      valEl.innerHTML = `${def.value} <i class="fas fa-coins" style="color:${goldColor};"></i>`;
      Object.assign(valEl.style, {
        fontSize:     "0.9em",
        color:        "var(--text-primary)",
        flex:         "0 0 auto",
        whiteSpace:   "nowrap"
      });
      sub.appendChild(valEl);
    }

    main.appendChild(sub);
    entry.appendChild(main);

    // Delete button, now using .btn-delete
    const delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.title = "Delete";
    Object.assign(delBtn.style, {
      marginLeft: "0.8em",
      flexShrink: 0
    });
    delBtn.onclick = e => {
      e.stopPropagation();
      onDelete(def.id);
    };
    entry.appendChild(delBtn);

    // Click handler
    entry.addEventListener("click", () => onClick(def));
    return entry;
  }

  function render() {
    const data = getDefinitions();
    const q    = filterTerm.trim().toLowerCase();
    container.innerHTML = "";
    data
      .filter(d => d.name?.toLowerCase().includes(q))
      .forEach(def => {
        const fn = typeof renderEntry === "function" ? renderEntry : defaultRenderer;
        container.appendChild(fn(def, layout, onEntryClick, onDelete));
      });
  }

  return {
    /** Refresh the list */
    refresh: render,
    /** Change layout */
    setLayout(newLayout) { layout = newLayout; render(); },
    /** Apply filter term */
    filter(term) { filterTerm = term || ""; render(); }
  };
}
 