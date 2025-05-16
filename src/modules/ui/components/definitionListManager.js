// @file: src/modules/ui/components/definitionListManager.js
// @version: 6.5 — richer default entry with thumbnail, meta

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
    entry.className = `def-entry def-entry--${layout}`;
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.padding = "0.5em";
    entry.style.margin = "0.2em 0";
    entry.style.background = "var(--bg-20)";
    entry.style.borderRadius = "4px";
    entry.style.cursor = "pointer";

    // thumbnail if available
    if (def.imageSmall) {
      const thumb = document.createElement("img");
      thumb.src = def.imageSmall;
      thumb.alt = def.name;
      thumb.style.width = "32px";
      thumb.style.height = "32px";
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "4px";
      thumb.style.marginRight = "0.6em";
      entry.appendChild(thumb);
    }

    // text container
    const textWrap = document.createElement("div");
    textWrap.style.flex = "1";

    // name
    const nameEl = document.createElement("div");
    nameEl.textContent = def.name;
    nameEl.style.fontWeight = "600";
    textWrap.appendChild(nameEl);

    // meta line (type, rarity or category/size)
    const metaEl = document.createElement("div");
    metaEl.style.fontSize = "0.85em";
    metaEl.style.color = "var(--text-secondary)";
    if (def.rarity) {
      metaEl.textContent = def.rarity.toUpperCase();
    } else if (def.category && def.size) {
      metaEl.textContent = `${def.category} • ${def.size}`;
    }
    textWrap.appendChild(metaEl);

    entry.appendChild(textWrap);

    // delete button
    const delBtn = document.createElement("button");
    delBtn.className = "ui-button-delete";
    delBtn.textContent = "×";
    delBtn.title = "Delete";
    delBtn.style.marginLeft = "0.6em";
    delBtn.onclick = e => {
      e.stopPropagation();
      onDelete(def.id);
    };
    entry.appendChild(delBtn);

    entry.addEventListener("click", () => onClick(def));
    return entry;
  }

  function render() {
    const data = getDefinitions();
    const q = filterTerm.trim().toLowerCase();
    container.innerHTML = "";
    data
      .filter(d => d.name?.toLowerCase().includes(q))
      .forEach(def => {
        const fn = typeof renderEntry === "function" ? renderEntry : defaultRenderer;
        container.appendChild(fn(def, layout, onEntryClick, onDelete));
      });
  }

  return {
    refresh: render,
    setLayout(newLayout) { layout = newLayout; render(); },
    filter(term) { filterTerm = term || ""; render(); }
  };
}
