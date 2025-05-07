// @version: 1
// @file: /scripts/modules/ui/entries/questEntryRenderer.js 

export function renderQuestEntry(def, layout = "row", { onClick, onDelete } = {}) {
    const entry = document.createElement("div");
    entry.className = `quest-def-entry layout-${layout}`;
  
    entry.innerHTML = `
      <div class="entry-name">${def.name || "Untitled Quest"}</div>
      <div class="entry-description">${def.description || "No description."}</div>
      <div class="entry-meta">Level: ${def.level || "—"} | Type: ${def.type || "—"}</div>
    `;
  
    if (onDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "entry-delete ui-button-delete";
      deleteBtn.innerText = "Delete";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (def.id && confirm(`Delete quest "${def.name}"?`)) onDelete(def.id);
      };
      entry.appendChild(deleteBtn);
    }
  
    if (onClick) {
      entry.addEventListener("click", () => onClick(def));
    }
  
    return entry;
  }
  