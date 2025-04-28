// @version: 1
// @file: /scripts/modules/ui/entries/npcEntryRenderer.js 

export function renderNpcEntry(def, layout = "row", { onClick, onDelete } = {}) {
    const entry = document.createElement("div");
    entry.className = `npc-def-entry layout-${layout}`;
  
    entry.innerHTML = `
      <div class="entry-name">${def.name || "Unnamed NPC"}</div>
      <div class="entry-role">${def.role || "No role assigned"}</div>
      <div class="entry-faction">${def.faction || "No faction"}</div>
    `;
  
    if (onDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "entry-delete ui-button-delete";
      deleteBtn.innerText = "Delete";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (def.id && confirm(`Delete NPC "${def.name}"?`)) onDelete(def.id);
      };
      entry.appendChild(deleteBtn);
    }
  
    if (onClick) {
      entry.addEventListener("click", () => onClick(def));
    }
  
    return entry;
  }
  